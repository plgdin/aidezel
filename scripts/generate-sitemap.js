import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 1. Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SITE_URL = 'https://www.aidezel.co.uk';

// 3. Check for keys
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ Error: Supabase keys not found in .env');
    process.exit(1);
}

// 4. Connect
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function generateSitemap() {
  console.log('🗺️  Generating Sitemap...');

  const staticRoutes = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/login',
    '/register',
    '/terms'
  ];

  // --- FIX IS HERE: Select 'created_at' instead of 'updated_at' ---
  const { data: products, error } = await supabase
    .from('products')
    .select('id, created_at'); 

  if (error) {
    console.error('❌ Failed to fetch products:', error);
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} products.`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes
    .map((route) => {
      return `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('')}

  ${products
    .map((product) => {
      // --- FIX IS HERE: Use created_at for lastmod ---
      return `
  <url>
    <loc>${SITE_URL}/product/${product.id}</loc>
    <lastmod>${new Date(product.created_at || Date.now()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    })
    .join('')}
</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  
  if (!fs.existsSync(publicDir)){
      fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  console.log('✅ Sitemap generated successfully at public/sitemap.xml');
}

generateSitemap();