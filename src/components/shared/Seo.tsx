import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

const Seo: React.FC<SeoProps> = ({ 
  title, 
  description = "Aidezel - Premium Electronics, Smart Gadgets & Accessories. Official Warranty & Fast UK Delivery.", 
  image = "https://aidezel.vercel.app/logo.png", // Make sure this URL is correct for your logo
  url = window.location.href 
}) => {
  const siteTitle = "Aidezel";
  const fullTitle = `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Facebook / Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default Seo;