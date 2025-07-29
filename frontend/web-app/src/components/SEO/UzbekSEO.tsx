import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article' | 'profile';
  language?: 'uz' | 'ru';
  structuredData?: Record<string, any>;
  noIndex?: boolean;
  productData?: {
    name: string;
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    brand: string;
    category: string;
    sku: string;
    images: string[];
    description: string;
    rating?: number;
    reviewCount?: number;
  };
}

const UzbekSEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage = 'https://ultramarket.uz/images/og-default.jpg',
  ogType = 'website',
  language = 'uz',
  structuredData,
  noIndex = false,
  productData,
}) => {
  const siteName = 'UltraMarket';
  const baseUrl = 'https://ultramarket.uz';

  // Default SEO content in Uzbek and Russian
  const seoContent = {
    uz: {
      defaultTitle: "UltraMarket - O'zbekistondagi Eng Yaxshi Onlayn Do'kon",
      defaultDescription:
        "UltraMarket - O'zbekistonda eng katta onlayn do'kon. Elektronika, kiyim, uy-ro'zg'or buyumlari va boshqa minglab mahsulotlar. Tezkor yetkazib berish va xavfsiz to'lov.",
      defaultKeywords: [
        'onlayn dokon uzbekistan',
        'elektron tijorat uzbekistan',
        'yetkazib berish toshkent',
        'click payme uzcard humo',
        'arzon narx',
        'ishonchli dokon',
        'tezkor yetkazib berish',
        'elektronika uzbekistan',
        'kiyim uzbekistan',
        'uy jihozlari uzbekistan',
      ],
    },
    ru: {
      defaultTitle: 'UltraMarket - Лучший Интернет-Магазин в Узбекистане',
      defaultDescription:
        'UltraMarket - крупнейший интернет-магазин в Узбекистане. Электроника, одежда, товары для дома и тысячи других товаров. Быстрая доставка и безопасная оплата.',
      defaultKeywords: [
        'интернет магазин узбекистан',
        'электронная коммерция узбекистан',
        'доставка ташкент',
        'click payme uzcard humo',
        'низкие цены',
        'надежный магазин',
        'быстрая доставка',
        'электроника узбекистан',
        'одежда узбекистан',
        'бытовая техника узбекистан',
      ],
    },
  };

  const currentContent = seoContent[language];
  const finalTitle = title || currentContent.defaultTitle;
  const finalDescription = description || currentContent.defaultDescription;
  const finalKeywords = keywords.length > 0 ? keywords : currentContent.defaultKeywords;

  // Generate structured data for products
  const generateProductStructuredData = () => {
    if (!productData) return null;

    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: productData.name,
      description: productData.description,
      brand: {
        '@type': 'Brand',
        name: productData.brand,
      },
      category: productData.category,
      sku: productData.sku,
      image: productData.images,
      offers: {
        '@type': 'Offer',
        url: canonicalUrl || window.location.href,
        priceCurrency: productData.currency,
        price: productData.price,
        availability: `https://schema.org/${productData.availability}`,
        seller: {
          '@type': 'Organization',
          name: 'UltraMarket',
          url: 'https://ultramarket.uz',
        },
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 30 days
      },
      aggregateRating:
        productData.rating && productData.reviewCount
          ? {
              '@type': 'AggregateRating',
              ratingValue: productData.rating,
              reviewCount: productData.reviewCount,
            }
          : undefined,
    };
  };

  // Generate organization structured data
  const generateOrganizationStructuredData = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UltraMarket',
    url: 'https://ultramarket.uz',
    logo: 'https://ultramarket.uz/images/logo.png',
    description:
      language === 'uz'
        ? "O'zbekistonda eng katta onlayn do'kon"
        : 'Крупнейший интернет-магазин в Узбекистане',
    address: {
      '@type': 'PostalAddress',
      streetAddress: "Amir Temur ko'chasi 15",
      addressLocality: 'Toshkent',
      addressRegion: 'Toshkent viloyati',
      postalCode: '100000',
      addressCountry: 'UZ',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+998-71-123-45-67',
        contactType: 'customer service',
        areaServed: 'UZ',
        availableLanguage: ['uz', 'ru'],
      },
    ],
    sameAs: [
      'https://t.me/ultramarket_uz',
      'https://instagram.com/ultramarket.uz',
      'https://facebook.com/ultramarket.uz',
    ],
    paymentAccepted: ['Click', 'Payme', 'Uzcard', 'Humo', 'Cash'],
    currenciesAccepted: 'UZS',
  });

  // Generate website structured data
  const generateWebsiteStructuredData = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    description: finalDescription,
    inLanguage: language,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });

  // Generate breadcrumb structured data
  const generateBreadcrumbStructuredData = () => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 1) return null;

    const breadcrumbItems = pathSegments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2, // Start from 2 (Home is 1)
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      item: `${baseUrl}/${pathSegments.slice(0, index + 1).join('/')}`,
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'uz' ? 'Bosh sahifa' : 'Главная',
          item: baseUrl,
        },
        ...breadcrumbItems,
      ],
    };
  };

  const finalStructuredData = structuredData || {
    organization: generateOrganizationStructuredData(),
    website: generateWebsiteStructuredData(),
    product: generateProductStructuredData(),
    breadcrumb: generateBreadcrumbStructuredData(),
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={language} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords.join(', ')} />

      {/* Robots and Indexing */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
      )}

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl || window.location.href} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={language === 'uz' ? 'uz_UZ' : 'ru_RU'} />
      <meta property="og:locale:alternate" content={language === 'uz' ? 'ru_RU' : 'uz_UZ'} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@ultramarket_uz" />

      {/* Uzbekistan-specific Meta Tags */}
      <meta name="geo.region" content="UZ" />
      <meta name="geo.placename" content="Uzbekistan" />
      <meta name="geo.position" content="41.377491;64.585262" />
      <meta name="ICBM" content="41.377491, 64.585262" />

      {/* Currency and Payment Meta */}
      <meta name="currency" content="UZS" />
      <meta name="payment-methods" content="Click,Payme,Uzcard,Humo,Cash" />

      {/* Mobile and Responsive */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Theme Colors */}
      <meta name="theme-color" content="#007bff" />
      <meta name="msapplication-TileColor" content="#007bff" />

      {/* Author and Copyright */}
      <meta name="author" content="UltraMarket Uzbekistan" />
      <meta name="copyright" content="© 2024 UltraMarket. Barcha huquqlar himoyalangan." />

      {/* Language Alternatives */}
      <link rel="alternate" hrefLang="uz" href={`${baseUrl}${window.location.pathname}`} />
      <link rel="alternate" hrefLang="ru" href={`${baseUrl}/ru${window.location.pathname}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${window.location.pathname}`} />

      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.ultramarket.uz" />
      <link rel="preconnect" href="https://cdn.ultramarket.uz" />

      {/* DNS Prefetch for External Resources */}
      <link rel="dns-prefetch" href="//click.uz" />
      <link rel="dns-prefetch" href="//checkout.paycom.uz" />
      <link rel="dns-prefetch" href="//api.express24.uz" />

      {/* Product-specific Meta Tags */}
      {productData && (
        <>
          <meta property="product:price:amount" content={productData.price.toString()} />
          <meta property="product:price:currency" content={productData.currency} />
          <meta property="product:availability" content={productData.availability} />
          <meta property="product:brand" content={productData.brand} />
          <meta property="product:category" content={productData.category} />
          {productData.rating && (
            <meta property="product:rating" content={productData.rating.toString()} />
          )}
        </>
      )}

      {/* Structured Data */}
      {Object.entries(finalStructuredData).map(
        ([key, data]) =>
          data && (
            <script
              key={key}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(data, null, 2),
              }}
            />
          )
      )}

      {/* Additional SEO Tags for E-commerce */}
      <meta name="format-detection" content="telephone=yes" />
      <meta name="format-detection" content="address=yes" />

      {/* Security Headers */}
      <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />

      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* RSS Feed */}
      <link
        rel="alternate"
        type="application/rss+xml"
        title={`${siteName} - ${language === 'uz' ? 'Yangiliklar' : 'Новости'}`}
        href={`${baseUrl}/rss/${language}.xml`}
      />

      {/* Sitemap */}
      <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    </Helmet>
  );
};

export default UzbekSEO;
