// src/components/StructuredData.tsx
import React from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
}

// Organization structured data for Nomadic Performance
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nomadic Performance",
  "url": "https://nomadicperformance.com",
  "logo": "https://nomadicperformance.com/NPLogo.png",
  "description": "Professional physical therapy and performance optimization services for outdoor athletes and adventurers in Utah.",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "UT",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-385-555-0123", // Placeholder - should be updated with real number
    "contactType": "customer service",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://www.facebook.com/nomadicperformance",
    "https://www.instagram.com/nomadicperformance",
    "https://www.linkedin.com/company/nomadicperformance"
  ],
  "founder": {
    "@type": "Person",
    "name": "Nomadic Performance Team",
    "jobTitle": "Physical Therapist & Performance Coach"
  },
  "knowsAbout": [
    "Physical Therapy",
    "Sports Medicine",
    "Injury Prevention",
    "Performance Training",
    "Outdoor Athletics",
    "Rehabilitation"
  ]
};

// Breadcrumb structured data generator
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://nomadicperformance.com${crumb.url}`
    }))
  };
}

// Article structured data generator for blog posts
export function generateArticleStructuredData(post: {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  tags?: string[];
  author?: string;
  imageUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Organization",
      "name": post.author || "Nomadic Performance",
      "url": "https://nomadicperformance.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nomadic Performance",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nomadicperformance.com/NPLogo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://nomadicperformance.com/blog/${post.slug}`
    },
    "url": `https://nomadicperformance.com/blog/${post.slug}`,
    "image": post.imageUrl || "https://nomadicperformance.com/NPLogo.png",
    "keywords": post.tags?.join(", ") || "",
    "articleSection": "Health & Fitness",
    "isAccessibleForFree": true
  };
}

// FAQ structured data generator
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Service structured data generator
export function generateServiceStructuredData(services: Array<{
  name: string;
  description: string;
  url?: string;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "provider": {
      "@type": "Organization",
      "name": "Nomadic Performance"
    },
    "serviceType": services.map(service => service.name),
    "description": services.map(service => service.description).join(" "),
    "areaServed": {
      "@type": "State",
      "name": "Utah"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Physical Therapy & Performance Services",
      "itemListElement": services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.name,
          "description": service.description,
          "url": service.url || "https://nomadicperformance.com/services"
        }
      }))
    }
  };
}

// Person structured data generator for Joe
export function generatePersonStructuredData(person: {
  name: string;
  jobTitle: string;
  description: string;
  imageUrl?: string;
  sameAs?: string[];
  knowsAbout?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": person.name,
    "jobTitle": person.jobTitle,
    "description": person.description,
    "image": person.imageUrl || "https://nomadicperformance.com/images/MTNme.jpeg",
    "worksFor": {
      "@type": "Organization",
      "name": "Nomadic Performance",
      "url": "https://nomadicperformance.com"
    },
    "sameAs": person.sameAs || [
      "https://www.instagram.com/nomadicperformance",
      "https://www.linkedin.com/in/joe-nomadicperformance"
    ],
    "knowsAbout": person.knowsAbout || [
      "Physical Therapy",
      "Sports Medicine",
      "Injury Prevention",
      "Performance Training",
      "Outdoor Athletics",
      "Rehabilitation",
      "Strength & Conditioning"
    ],
    "alumniOf": {
      "@type": "EducationalOrganization",
      "name": "Boston University",
      "department": "Physical Therapy Program"
    },
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "name": "Doctor of Physical Therapy",
      "educationalLevel": "Doctorate"
    }
  };
}

// ContactPoint structured data generator
export function generateContactPointStructuredData(contactPoints: Array<{
  telephone?: string;
  email?: string;
  contactType: string;
  areaServed?: string;
  availableLanguage?: string;
  hoursAvailable?: string;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPoint",
    "contactPoint": contactPoints.map(point => ({
      "@type": "ContactPoint",
      "telephone": point.telephone,
      "email": point.email,
      "contactType": point.contactType,
      "areaServed": point.areaServed || "Utah",
      "availableLanguage": point.availableLanguage || "English",
      "hoursAvailable": point.hoursAvailable || "Monday-Friday 9:00-17:00"
    }))
  };
}

// LocalBusiness structured data generator
export function generateLocalBusinessStructuredData(business: {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string;
  priceRange?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": business.name,
    "description": business.description,
    "url": business.url,
    "telephone": business.telephone,
    "email": business.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": business.address.addressLocality,
      "addressRegion": business.address.addressRegion,
      "addressCountry": business.address.addressCountry,
      "streetAddress": business.address.streetAddress,
      "postalCode": business.address.postalCode
    },
    "geo": business.geo ? {
      "@type": "GeoCoordinates",
      "latitude": business.geo.latitude,
      "longitude": business.geo.longitude
    } : undefined,
    "openingHours": business.openingHours,
    "priceRange": business.priceRange || "$$",
    "image": business.image || "https://nomadicperformance.com/NPLogo.png",
    "sameAs": [
      "https://www.instagram.com/nomadicperformance",
      "https://www.linkedin.com/company/nomadicperformance"
    ]
  };
}
