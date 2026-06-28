import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const footerLinks = {
  product: [
    { key: 'all_products', to: '/products' },
    { key: 'accounts', to: '/products?type=account' },
    { key: 'source_code', to: '/products?type=source_code' },
    { key: 'tools_scripts', to: '/products?type=tool' },
  ],
  support: [
    { key: 'help_center', to: '/support' },
    { key: 'contact_us', to: '/support/new' },
    { key: 'faqs', to: '/faq' },
    { key: 'ticket_system', to: '/tickets' },
  ],
  company: [
    { key: 'about_us', to: '/about' },
    { key: 'terms_of_service', to: '/terms' },
    { key: 'privacy_policy', to: '/privacy' },
    { key: 'refund_policy', to: '/refund' },
  ],
};

const socialLinks = [
  {
    label: 'Telegram',
    href: 'https://t.me/mmostore',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.276c-.125.438-.456.547-.898.34l-3.347-2.491-1.647 1.592c-.18.173-.33.32-.452.337-.121.017-.377.017-.586-.102L7.5 13.917V13.78l-1.276-.818c-.38-.241-.774-.341-1.18-.305l.014.003 8.413 3.063c.402.146.654.482.655.874l.002.03 2.128 8.979c.04.169.144.264.273.31.13.046.282.04.432-.016l10.792-6.938c.237-.153.373-.43.374-.753-.001-.322-.138-.598-.377-.754z"/>
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/mmostore',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.985 10.985 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/mmostore',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-bg-secondary border-t border-border">
      <div className="container-lg py-12 lg:py-16">
        {/* Main footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-text-primary">MMO</span>
                <span className="text-xl font-bold text-primary">Store</span>
              </div>
            </Link>
            <p className="text-sm text-text-secondary mb-6">
              {t('footer.tagline')}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-bg-tertiary border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">{t('footer.products_title')}</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">{t('footer.support_title')}</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">{t('footer.company_title')}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">{t('footer.newsletter_title')}</h4>
            <p className="text-sm text-text-secondary mb-4">
              {t('footer.newsletter_desc')}
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.email_placeholder')}
                className="input flex-1 py-2 px-3 text-sm"
              />
              <button className="btn btn-primary py-2 px-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-tertiary">
            {t('footer.copyright')} {new Date().getFullYear()} MMO Store. {t('footer.rights_reserved')}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/cookies" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
              {t('footer.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
