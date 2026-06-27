import { useEffect, useCallback } from 'react';

const DEFAULT_TITLE = 'MMO Store';
const DEFAULT_SEPARATOR = '|';
const DEFAULT_DESCRIPTION = 'Hệ thống mua bán tự động 24/7 - Tài khoản Premium, Source Code, Tools & Scripts chất lượng cao';

export function useSEO({ 
  title, 
  description = DEFAULT_DESCRIPTION,
  keywords,
  ogImage,
  noIndex = false 
}) {
  const fullTitle = title ? `${title} ${DEFAULT_SEPARATOR} ${DEFAULT_TITLE}` : DEFAULT_TITLE;

  useEffect(() => {
    // Set document title
    document.title = fullTitle;

    // Set meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;

    // Set keywords if provided
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = keywords;
    }

    // Open Graph tags
    const ogTags = [
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: DEFAULT_TITLE },
    ];

    if (ogImage) {
      ogTags.push({ property: 'og:image', content: ogImage });
    }

    ogTags.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // Twitter Card
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.name = 'twitter:card';
      document.head.appendChild(twitterCard);
    }
    twitterCard.content = ogImage ? 'summary_large_image' : 'summary';

    // Robots
    if (noIndex) {
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex, nofollow';
    }

    // Cleanup function
    return () => {
      // Optional: Reset to default on unmount if needed
    };
  }, [fullTitle, description, keywords, ogImage, noIndex]);

  // Return helper function for programmatic title changes
  const setTitle = useCallback((newTitle) => {
    const newFullTitle = newTitle 
      ? `${newTitle} ${DEFAULT_SEPARATOR} ${DEFAULT_TITLE}` 
      : DEFAULT_TITLE;
    document.title = newFullTitle;
  }, []);

  return { setTitle, fullTitle };
}

// SEO Component for static pages
export function SEOHead({ 
  title, 
  description = DEFAULT_DESCRIPTION,
  keywords,
  ogImage,
  noIndex = false 
}) {
  const fullTitle = title ? `${title} ${DEFAULT_SEPARATOR} ${DEFAULT_TITLE}` : DEFAULT_TITLE;

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  return null; // This component just triggers the effect
}

export default useSEO;
