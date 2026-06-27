import prisma from '../../database/prisma.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../../config/index.js';

class AssetService {
  // Token expiry time (30 minutes)
  static TOKEN_EXPIRY_MINUTES = 30;

  // Generate and store secure download token
  async generateDownloadToken(assetId, userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + AssetService.TOKEN_EXPIRY_MINUTES * 60 * 1000);
    
    // Store token in database
    await prisma.downloadToken.create({
      data: {
        token,
        assetId,
        userId,
        expiresAt,
        used: false,
      },
    });
    
    return { token, expiresAt };
  }

  // Validate download token
  async validateDownloadToken(token) {
    // Find token in database
    const downloadToken = await prisma.downloadToken.findUnique({
      where: { token },
      include: {
        asset: {
          include: {
            product: true,
          },
        },
      },
    });
    
    // Token not found
    if (!downloadToken) {
      throw new Error('Invalid download token');
    }
    
    // Token expired
    if (new Date() > downloadToken.expiresAt) {
      throw new Error('Download token has expired');
    }
    
    // Token already used
    if (downloadToken.used) {
      throw new Error('Download token has already been used');
    }
    
    // Asset not available
    if (!downloadToken.asset || !downloadToken.asset.isActive) {
      throw new Error('Asset not available');
    }
    
    // File doesn't exist
    if (!fs.existsSync(downloadToken.asset.filePath)) {
      throw new Error('File not found on server');
    }
    
    return downloadToken;
  }

  // Mark token as used
  async markTokenUsed(token) {
    await prisma.downloadToken.update({
      where: { token },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
  }

  // Revoke all tokens for an asset (admin action)
  async revokeAssetTokens(assetId) {
    await prisma.downloadToken.updateMany({
      where: { assetId },
      data: {
        expiresAt: new Date(0), // Set to epoch
      },
    });
  }

  // Cleanup expired tokens (called periodically)
  async cleanupExpiredTokens() {
    const result = await prisma.downloadToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true, usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Delete used tokens after 24h
        ],
      },
    });
    
    console.log(`🧹 Cleaned up ${result.count} expired/downloaded tokens`);
    return result.count;
  }

  // Upload new asset
  async uploadAsset(productId, file, userId) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = this.getAssetType(ext);
    
    // Check if asset with same name exists
    const existing = await prisma.digitalAsset.findFirst({
      where: {
        productId,
        originalName: file.originalname,
      },
    });
    
    const version = existing ? existing.version + 1 : 1;
    
    const asset = await prisma.digitalAsset.create({
      data: {
        productId,
        name: path.basename(file.originalname, ext),
        type: mimeType,
        filename: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        version,
      },
    });
    
    return asset;
  }

  // Get asset type from extension
  getAssetType(ext) {
    const typeMap = {
      '.zip': 'ZIP',
      '.rar': 'RAR',
      '.7z': 'RAR',
      '.txt': 'TXT',
      '.csv': 'CSV',
      '.json': 'OTHER',
      '.js': 'SOURCE_CODE',
      '.html': 'SOURCE_CODE',
      '.pdf': 'OTHER',
    };
    return typeMap[ext] || 'OTHER';
  }

  // Get all assets for product
  async getProductAssets(productId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    
    const [assets, total] = await Promise.all([
      prisma.digitalAsset.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.digitalAsset.count({ where: { productId } }),
    ]);
    
    return {
      assets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get asset by ID
  async getAssetById(id) {
    return prisma.digitalAsset.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, name: true, price: true },
        },
      },
    });
  }

  // Update asset
  async updateAsset(id, data) {
    return prisma.digitalAsset.update({
      where: { id },
      data,
    });
  }

  // Delete asset
  async deleteAsset(id) {
    const asset = await prisma.digitalAsset.findUnique({ where: { id } });
    
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    // Delete physical file
    if (fs.existsSync(asset.filePath)) {
      fs.unlinkSync(asset.filePath);
    }
    
    // Revoke all tokens for this asset
    await this.revokeAssetTokens(id);
    
    return prisma.digitalAsset.delete({ where: { id } });
  }

  // Get secure download URL (requires purchase verification)
  async getSecureDownloadUrl(assetId, userId) {
    const asset = await prisma.digitalAsset.findUnique({
      where: { id: assetId },
      include: { product: true },
    });
    
    if (!asset || !asset.isActive) {
      throw new Error('Asset not available');
    }
    
    // Check if user has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: asset.productId,
        order: {
          userId,
          status: { in: ['COMPLETED', 'PROCESSING', 'PAID'] },
        },
      },
    });
    
    if (!hasPurchased) {
      throw new Error('You have not purchased this product');
    }
    
    // Generate secure token and store in database
    const { token, expiresAt } = await this.generateDownloadToken(assetId, userId);
    
    // Update download count
    await prisma.digitalAsset.update({
      where: { id: assetId },
      data: { downloadCount: { increment: 1 } },
    });
    
    // Log download
    await prisma.assetDownload.create({
      data: {
        assetId,
        userId,
      },
    });
    
    return {
      downloadUrl: `/api/assets/download/${assetId}?token=${token}`,
      expiresAt,
      filename: asset.originalName,
      fileSize: asset.fileSize,
      expiresInMinutes: AssetService.TOKEN_EXPIRY_MINUTES,
    };
  }

  // Download asset with token verification
  async downloadAsset(assetId, token, userId) {
    // Validate token - this throws if invalid
    const downloadToken = await this.validateDownloadToken(token);
    
    // Verify token belongs to this asset
    if (downloadToken.assetId !== assetId) {
      throw new Error('Token does not match asset');
    }
    
    // Mark token as used (single-use)
    await this.markTokenUsed(token);
    
    const asset = downloadToken.asset;
    
    return {
      filePath: asset.filePath,
      filename: asset.originalName,
      mimeType: asset.mimeType,
    };
  }

  // Get download history
  async getDownloadHistory(assetId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    
    const [downloads, total] = await Promise.all([
      prisma.assetDownload.findMany({
        where: { assetId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.assetDownload.count({ where: { assetId } }),
    ]);
    
    return {
      downloads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get asset statistics
  async getAssetStatistics(productId = null) {
    const where = productId ? { productId } : {};
    
    const [totalAssets, totalDownloads, totalSize] = await Promise.all([
      prisma.digitalAsset.count({ where }),
      prisma.digitalAsset.aggregate({
        where,
        _sum: { downloadCount: true },
      }),
      prisma.digitalAsset.aggregate({
        where,
        _sum: { fileSize: true },
      }),
    ]);
    
    return {
      totalAssets,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      totalSizeBytes: totalSize._sum.fileSize || 0,
      totalSizeMB: Math.round((totalSize._sum.fileSize || 0) / (1024 * 1024) * 100) / 100,
    };
  }

  // Toggle asset active status
  async toggleAssetStatus(id) {
    const asset = await prisma.digitalAsset.findUnique({ where: { id } });
    
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    const updated = await prisma.digitalAsset.update({
      where: { id },
      data: { isActive: !asset.isActive },
    });
    
    // If deactivating, revoke all tokens
    if (updated.isActive === false) {
      await this.revokeAssetTokens(id);
    }
    
    return updated;
  }

  // Get asset versions
  async getAssetVersions(productId, originalName) {
    return prisma.digitalAsset.findMany({
      where: {
        productId,
        originalName,
      },
      orderBy: { version: 'desc' },
    });
  }
}

export default new AssetService();
