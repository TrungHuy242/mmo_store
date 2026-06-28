import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Eye, EyeOff, Copy, Check, Loader2, ChevronLeft, ChevronRight, Key, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { licenseApi, assetApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge, Tabs, Skeleton } from '../components/ui';

export default function Licenses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [copiedId, setCopiedId] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const fetchLicenses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
      };
      
      const res = await licenseApi.getMyLicenses(params);
      const data = res.data;
      
      setLicenses(data.data || []);
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page || 1,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchLicenses(1);
  }, []);

  const filteredLicenses = licenses.filter(l => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return l.status === 'ACTIVE';
    if (activeTab === 'expired') return l.status === 'EXPIRED';
    if (activeTab === 'inactive') return l.status === 'INACTIVE';
    return true;
  });

  const searchedLicenses = search
    ? filteredLicenses.filter(l => {
        const searchLower = search.toLowerCase();
        return (
          l.key?.toLowerCase().includes(searchLower) ||
          l.product?.name?.toLowerCase().includes(searchLower) ||
          l.productName?.toLowerCase().includes(searchLower)
        );
      })
    : filteredLicenses;

  const tabs = [
    { id: 'all', label: `${t('common.all')} (${licenses.length})` },
    { id: 'active', label: `${t('common.active')} (${licenses.filter(l => l.status === 'ACTIVE').length})` },
    { id: 'inactive', label: `${t('common.inactive') || 'Chưa kích hoạt'} (${licenses.filter(l => l.status === 'INACTIVE').length})` },
    { id: 'expired', label: `${t('common.expired')} (${licenses.filter(l => l.status === 'EXPIRED' || (l.expiresAt && new Date(l.expiresAt) < new Date())).length})` },
  ];

  const copyKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key) => {
    if (!key) return '••••-••••-••••-••••';
    const parts = key.split('-');
    if (parts.length === 4) {
      return `${parts[0]}-••••-••••-${parts[3]}`;
    }
    return key.substring(0, 4) + '-••••-••••-••••';
  };

  // Secure file download with progress tracking
  const handleDownload = async (license, assetId) => {
    if (!assetId) {
      toast.error(t('toasts.file_not_found'));
      return;
    }

    setDownloadingId(license.id);
    setDownloadProgress(0);

    try {
      // Get download URL first
      const res = await assetApi.getDownloadUrl(assetId);
      const downloadData = res.data?.data || res.data;
      
      if (downloadData?.url) {
        // Simulate progress for URL download
        const progressInterval = setInterval(() => {
          setDownloadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        // Trigger download via link click
        const link = document.createElement('a');
        link.href = downloadData.url;
        link.download = downloadData.filename || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        setTimeout(() => {
          setDownloadingId(null);
          setDownloadProgress(0);
        }, 1000);

        toast.success(t('toasts.download_started'));
      } else {
        // Fallback: direct blob download
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/assets/download/${assetId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Download failed');

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match) filename = match[1].replace(/['"]/g, '');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setDownloadProgress(100);
        setTimeout(() => {
          setDownloadingId(null);
          setDownloadProgress(0);
        }, 1000);

        toast.success(t('toasts.download_success'));
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toasts.download_failed'));
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const getStatusColor = (status, expiresAt) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'INACTIVE') return 'default';
    if (status === 'BLACKLISTED') return 'danger';
    if (status === 'EXPIRED' || (expiresAt && new Date(expiresAt) < new Date())) return 'danger';
    return 'default';
  };

  const getStatusLabel = (status, expiresAt) => {
    if (status === 'ACTIVE') return t('common.active');
    if (status === 'INACTIVE') return t('common.inactive') || 'Chưa kích hoạt';
    if (status === 'BLACKLISTED') return t('common.blacklisted') || 'Bị khóa';
    if (status === 'EXPIRED' || (expiresAt && new Date(expiresAt) < new Date())) return t('common.expired');
    return status || 'N/A';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLicenses(newPage);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <section className="bg-bg-secondary border-b border-border py-8">
        <div className="container-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-text-primary mb-1">{t('licenses.my_licenses')}</h1>
            <p className="text-text-secondary">{t('licenses.access_products')}</p>
          </motion.div>
        </div>
      </section>

      <div className="container-lg py-8">
        {/* Search & Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('licenses.search_placeholder') || 'Tìm kiếm theo tên sản phẩm hoặc mã key...'}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        <div className="mt-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : searchedLicenses.length > 0 ? (
            <>
              <div className="space-y-4">
                {searchedLicenses.map((license, i) => (
                  <motion.div
                    key={license.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <LicenseCard
                      license={license}
                      onCopy={() => copyKey(license.key, license.id)}
                      onToggleVisibility={() => toggleKeyVisibility(license.id)}
                      isCopied={copiedId === license.id}
                      isVisible={visibleKeys[license.id] || false}
                      maskedKey={maskKey(license.key)}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                      t={t}
                      onDownload={handleDownload}
                      isDownloading={downloadingId === license.id}
                      downloadProgress={downloadingId === license.id ? downloadProgress : 0}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-text-secondary px-4">
                    {t('common.page') || 'Trang'} {pagination.page} / {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-bg-secondary rounded-xl border border-border">
              <Key className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">{t('licenses.no_licenses')}</h3>
              <p className="text-text-secondary mb-6">
                {search ? t('licenses.no_results') || 'Không tìm thấy kết quả' : t('licenses.purchase_to_see')}
              </p>
              {!search && (
                <Link to="/products">
                  <Button>{t('licenses.browse_products')}</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LicenseCard({ license, onCopy, onToggleVisibility, isCopied, isVisible, maskedKey, getStatusColor, getStatusLabel, t, onDownload, isDownloading, downloadProgress }) {
  const productName = license.product?.name || license.productName || 'Product';
  const actualKey = license.key || 'N/A';
  const expiresAt = license.expiresAt;
  
  // Check if product is a file type (digital asset)
  const isFileProduct = license.product?.productType === 'digital' || license.product?.type === 'file';
  const hasAsset = license.assetId || license.assets?.length > 0;
  const assetId = license.assetId || license.assets?.[0]?.id;
  
  // Determine if download is available
  const canDownload = isFileProduct && hasAsset && license.status === 'ACTIVE';

  return (
    <Card className="p-6 hover:border-primary/30 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Product Info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            {license.product?.thumbnail ? (
              <img src={license.product.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Key className="w-6 h-6 text-text-secondary" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-text-primary truncate">{productName}</h3>
            <p className="text-xs text-text-tertiary mt-1">{t('licenses.license_key')}</p>
            
            {/* Key Display */}
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded-lg font-mono">
                {isVisible ? actualKey : maskedKey}
              </code>
              <button
                onClick={onToggleVisibility}
                className="p-1.5 rounded-lg bg-bg-tertiary hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors"
                title={isVisible ? t('common.hide') || 'Ẩn' : t('common.show') || 'Hiện'}
              >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant={getStatusColor(license.status, expiresAt)}>
            {getStatusLabel(license.status, expiresAt)}
          </Badge>
          
          {expiresAt && (
            <span className="text-xs text-text-tertiary whitespace-nowrap">
              {t('licenses.expires')}: {new Date(expiresAt).toLocaleDateString()}
            </span>
          )}

          {license.activatedAt && (
            <span className="text-xs text-text-tertiary whitespace-nowrap hidden sm:inline">
              {t('licenses.activated')}: {new Date(license.activatedAt).toLocaleDateString()}
            </span>
          )}

          <Button
            variant={isCopied ? 'success' : 'outline'}
            size="sm"
            onClick={onCopy}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                {t('common.copied')}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                {t('common.copy')}
              </>
            )}
          </Button>
          
          {/* Download Button for File Products */}
          {canDownload && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onDownload(license, assetId)}
              disabled={isDownloading}
              className="relative overflow-hidden"
            >
              {isDownloading ? (
                <>
                  <div 
                    className="absolute inset-0 bg-success/30 transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                  <div className="relative flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {downloadProgress > 0 ? `${downloadProgress}%` : 'Đang tải...'}
                  </div>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  {t('licenses.download_file') || 'Tải file'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
