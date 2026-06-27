import nodemailer from 'nodemailer';
import config from '../../config/index.js';

class EmailService {
  isEnabled() {
    return config.smtp.host && config.smtp.user && config.smtp.password;
  }

  getTransporter() {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }

  async sendMail({ to, subject, html, text }) {
    if (!this.isEnabled()) {
      console.log('Email service disabled, skipping email:', subject, 'to:', to);
      return true;
    }

    try {
      const transporter = this.getTransporter();
      
      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
        text,
      });
      
      return true;
    } catch (error) {
      console.error('Email send error:', error.message);
      return false;
    }
  }

  async sendVerificationEmail(user) {
    const verifyUrl = `${config.frontendUrl}/verify-email/${user.id}/${user.emailToken}`;
    
    return this.sendMail({
      to: user.email,
      subject: 'Verify your email - MMO Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Welcome to MMO Store!</h1>
          <p>Hello ${user.fullName || user.email},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Verify Email
          </a>
          <p>Or copy this link: ${verifyUrl}</p>
          <p>This link expires in 24 hours.</p>
          <p>Best regards,<br>MMO Store Team</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    
    return this.sendMail({
      to: user.email,
      subject: 'Reset your password - MMO Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Password Reset</h1>
          <p>Hello ${user.fullName || user.email},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Reset Password
          </a>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>MMO Store Team</p>
        </div>
      `,
    });
  }

  async sendOrderConfirmation(order) {
    return this.sendMail({
      to: order.user.email,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Order Confirmed!</h1>
          <p>Thank you for your order!</p>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Total:</strong> ${new Intl.NumberFormat('vi-VN').format(Number(order.total))}₫</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <hr style="margin: 20px 0;">
          <h3>Items:</h3>
          ${order.items.map(item => `
            <div style="margin: 8px 0;">
              <strong>${item.product.name}</strong> x${item.quantity}
              <span style="float: right;">${new Intl.NumberFormat('vi-VN').format(Number(item.price))}₫</span>
            </div>
          `).join('')}
          <hr style="margin: 20px 0;">
          <p>You can track your order at: ${config.frontendUrl}/dashboard/orders</p>
        </div>
      `,
    });
  }

  // Send order delivery email with beautiful HTML template
  async sendOrderDeliveryEmail(order, deliveryResults) {
    const successResults = deliveryResults.filter(r => r.success);
    
    if (successResults.length === 0) return;

    const orderItems = order.items.filter(item => item.deliveredAt);

    const itemsHtml = orderItems.map((item, index) => {
      const result = successResults.find(r => r.productName === item.product.name);
      let deliveryContent = '';

      if (result?.type === 'license' && result.deliveryData) {
        deliveryContent = result.deliveryData.key || result.deliveryData.content || '';
      } else if (result?.type === 'account' && result.deliveryData) {
        deliveryContent = result.deliveryData.content || '';
      } else if (result?.type === 'digital' && result.deliveryData?.assets) {
        deliveryContent = result.deliveryData.assets
          .map(a => a.downloadUrl)
          .filter(Boolean)
          .join('\n');
      }

      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #2d3748;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #06b6d4, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                ${index + 1}
              </div>
              <div>
                <p style="margin: 0; font-weight: 600; color: #f8fafc;">${item.product.name}</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">x${item.quantity}</p>
              </div>
            </div>
          </td>
        </tr>
        ${deliveryContent ? `
        <tr>
          <td style="padding: 0 16px 16px 68px; border-bottom: 1px solid #2d3748;">
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-top: 8px;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px;">
                ${result.type === 'license' ? '🔑 License Key' : result.type === 'account' ? '👤 Account Details' : '📁 Download Links'}
              </p>
              <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; color: #e2e8f0; white-space: pre-wrap; word-break: break-all;">${deliveryContent}</pre>
            </div>
          </td>
        </tr>
        ` : ''}
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivery - ${order.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          
          <!-- Header with Neon Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                🎉 Delivery Complete!
              </h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
                Your order is ready
              </p>
            </td>
          </tr>
          
          <!-- Order Info -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #334155;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Order Number
                    </p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #06b6d4; font-family: monospace;">
                      ${order.orderNumber}
                    </p>
                  </td>
                  <td style="vertical-align: top; text-align: right;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Total Paid
                    </p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #f8fafc;">
                      ${new Intl.NumberFormat('vi-VN').format(Number(order.total))}₫
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 32px 8px;">
              <p style="margin: 0; font-size: 16px; color: #f8fafc;">
                Xin chào <strong>${order.user.fullName || order.user.email}</strong>,
              </p>
              <p style="margin: 12px 0 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Cảm ơn bạn đã mua hàng tại <span style="color: #06b6d4; font-weight: 600;">MMO Store</span>! 
                Dưới đây là thông tin sản phẩm bạn đã đặt mua:
              </p>
            </td>
          </tr>
          
          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
                ${itemsHtml}
              </table>
            </td>
          </tr>
          
          <!-- Footer Note -->
          <tr>
            <td style="padding: 24px 32px;">
              <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #06b6d4; font-weight: 600;">
                  💡 Lưu ý quan trọng
                </p>
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                  Vui lòng giữ kín thông tin đăng nhập/tài khoản và không chia sẻ với người khác. 
                  Nếu cần hỗ trợ, hãy liên hệ qua <a href="${config.frontendUrl}/support" style="color: #06b6d4;">trang hỗ trợ</a> của chúng tôi.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #0f172a; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #f8fafc;">
                Cảm ơn bạn đã tin tưởng <span style="color: #06b6d4; font-weight: 600;">MMO Store</span>!
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Email này được gửi tự động. Vui lòng không trả lời email này.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
═══════════════════════════════════════════
🎉 DELIVERY COMPLETE - MMO STORE
═══════════════════════════════════════════

Order Number: ${order.orderNumber}
Total Paid: ${new Intl.NumberFormat('vi-VN').format(Number(order.total))}₫

Xin chào ${order.user.fullName || order.user.email},

Cảm ơn bạn đã mua hàng tại MMO Store!

───────────────────────────────────────────
SẢN PHẨM ĐÃ BÀN GIAO:
───────────────────────────────────────────

${orderItems.map((item, index) => {
  const result = successResults.find(r => r.productName === item.product.name);
  let content = '';
  if (result?.type === 'license' && result.deliveryData) {
    content = `\n🔑 License Key:\n${result.deliveryData.key || result.deliveryData.content}`;
  } else if (result?.type === 'account' && result.deliveryData) {
    content = `\n👤 Account Details:\n${result.deliveryData.content}`;
  } else if (result?.type === 'digital' && result.deliveryData?.assets) {
    content = '\n📁 Download Links:\n' + result.deliveryData.assets.map(a => a.downloadUrl).filter(Boolean).join('\n');
  }
  return `${index + 1}. ${item.product.name} x${item.quantity}${content}`;
}).join('\n\n')}

───────────────────────────────────────────
Lưu kín thông tin và không chia sẻ với người khác.
Cần hỗ trợ? Liên hệ: ${config.frontendUrl}/support
═══════════════════════════════════════════
    `.trim();

    return this.sendMail({
      to: order.user.email,
      subject: `📦 Order ${order.orderNumber} - Delivery Ready!`,
      html,
      text: textContent,
    });
  }
}

export default new EmailService();
