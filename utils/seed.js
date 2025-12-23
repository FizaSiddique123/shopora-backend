/**
 * Database Seed Script
 * 
 * PROBLEM IT SOLVES: Populates database with dummy data for development/testing.
 * Instead of manually creating products, this script adds realistic Nykaa-like
 * beauty products to the database.
 * 
 * HOW IT WORKS: Connects to database, clears existing products (optional),
 * and inserts seed data.
 * 
 * REAL-WORLD: Companies use seed scripts for:
 * - Development environment setup
 * - Testing with realistic data
 * - Demo environments
 * 
 * USAGE: npm run seed
 */

import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

dotenv.config();

const products = [
  // Makeup Products
  {
    name: 'Lakme 9 to 5 Weightless Mousse Foundation',
    description: 'A lightweight, matte finish foundation that provides full coverage with a natural look. Perfect for everyday wear with SPF 20 protection.',
    price: 399,
    originalPrice: 499,
    category: 'Makeup',
    brand: 'Lakme',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500'
    ],
    stock: 50,
    featured: true,
    bestSeller: true,
    tags: ['foundation', 'matte', 'full-coverage']
  },
  {
    name: 'Maybelline New York Fit Me Matte + Poreless Foundation',
    description: 'Fit Me Matte + Poreless Foundation for normal to oily skin. Refined clay formula for a poreless-looking finish with medium to full coverage.',
    price: 299,
    originalPrice: 399,
    category: 'Makeup',
    brand: 'Maybelline',
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500'
    ],
    stock: 75,
    featured: true,
    tags: ['foundation', 'matte', 'oily-skin']
  },
  {
    name: 'Sugar Cosmetics Matte As Hell Crayon Lipstick',
    description: 'Highly pigmented, long-lasting matte lipstick crayon. Available in 12 stunning shades. Comfortable to wear with 8-hour stay power.',
    price: 449,
    originalPrice: 549,
    category: 'Makeup',
    brand: 'Sugar Cosmetics',
    images: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500'
    ],
    stock: 100,
    bestSeller: true,
    tags: ['lipstick', 'matte', 'long-lasting']
  },
  {
    name: 'Colorbar Velvet Matte Lipstick',
    description: 'Intense color payoff with a velvety matte finish. Enriched with Vitamin E for smooth, hydrated lips.',
    price: 525,
    originalPrice: 650,
    category: 'Makeup',
    brand: 'Colorbar',
    images: [
      'https://images.unsplash.com/photo-1631216340907-427c93701f3a?w=500'
    ],
    stock: 60,
    tags: ['lipstick', 'matte', 'vitamin-e']
  },
  {
    name: 'Swiss Beauty Professional Makeup Brush Set',
    description: 'Complete 12-piece brush set made with premium synthetic bristles. Perfect for flawless makeup application.',
    price: 599,
    originalPrice: 899,
    category: 'Tools & Brushes',
    brand: 'Swiss Beauty',
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500'
    ],
    stock: 40,
    featured: true,
    tags: ['brushes', 'makeup-tools', 'set']
  },

  // Skincare Products
  {
    name: 'The Ordinary Niacinamide 10% + Zinc 1%',
    description: 'High-strength vitamin and mineral formula for reducing blemishes and balancing visible sebum activity.',
    price: 1299,
    originalPrice: 1599,
    category: 'Skincare',
    brand: 'The Ordinary',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'
    ],
    stock: 30,
    featured: true,
    bestSeller: true,
    tags: ['serum', 'niacinamide', 'blemish-control']
  },
  {
    name: 'Cetaphil Gentle Skin Cleanser',
    description: 'Soap-free, fragrance-free cleanser ideal for sensitive skin. Removes impurities without stripping the skin barrier.',
    price: 349,
    originalPrice: 399,
    category: 'Skincare',
    brand: 'Cetaphil',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500'
    ],
    stock: 80,
    bestSeller: true,
    tags: ['cleanser', 'sensitive-skin', 'gentle']
  },
  {
    name: 'Plum Green Tea Mattifying Moisturizer',
    description: 'Oil-free, non-comedogenic moisturizer for oily and acne-prone skin. Controls shine and keeps skin hydrated.',
    price: 450,
    originalPrice: 550,
    category: 'Skincare',
    brand: 'Plum',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500'
    ],
    stock: 65,
    tags: ['moisturizer', 'oily-skin', 'green-tea']
  },
  {
    name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 50+',
    description: 'Lightweight, non-greasy sunscreen with SPF 50+ protection. Water and sweat resistant for up to 80 minutes.',
    price: 599,
    originalPrice: 699,
    category: 'Skincare',
    brand: 'Neutrogena',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500'
    ],
    stock: 90,
    featured: true,
    tags: ['sunscreen', 'spf50', 'water-resistant']
  },
  {
    name: 'Lakme Absolute Perfect Radiance Face Serum',
    description: 'Brightening face serum with Pearl Protein and SPF 15. Reduces dark spots and evens skin tone.',
    price: 599,
    originalPrice: 699,
    category: 'Skincare',
    brand: 'Lakme',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'
    ],
    stock: 55,
    tags: ['serum', 'brightening', 'dark-spots']
  },

  // Haircare Products
  {
    name: 'L\'Oréal Paris Total Repair 5 Shampoo',
    description: 'Shampoo for damaged hair. Repairs 5 signs of hair damage: split ends, roughness, weakness, dullness, and dehydration.',
    price: 175,
    originalPrice: 200,
    category: 'Haircare',
    brand: 'L\'Oréal Paris',
    images: [
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'
    ],
    stock: 120,
    bestSeller: true,
    tags: ['shampoo', 'repair', 'damaged-hair']
  },
  {
    name: 'Pantene Hair Fall Control Shampoo',
    description: 'Shampoo with Pro-Vitamin formula that reduces hair fall and strengthens hair from root to tip.',
    price: 199,
    originalPrice: 249,
    category: 'Haircare',
    brand: 'Pantene',
    images: [
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'
    ],
    stock: 100,
    featured: true,
    tags: ['shampoo', 'hair-fall', 'strengthening']
  },
  {
    name: 'Dove Intense Repair Hair Mask',
    description: 'Deep conditioning hair mask that repairs damaged hair in 1 wash. Makes hair 10x stronger and smoother.',
    price: 349,
    originalPrice: 399,
    category: 'Haircare',
    brand: 'Dove',
    images: [
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'
    ],
    stock: 70,
    tags: ['hair-mask', 'repair', 'conditioning']
  },
  {
    name: 'Wella Professionals Oil Reflections Luminous Smoothing Oil',
    description: 'Lightweight smoothing oil for all hair types. Adds shine, smooths frizz, and protects from heat damage.',
    price: 899,
    originalPrice: 1099,
    category: 'Haircare',
    brand: 'Wella Professionals',
    images: [
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'
    ],
    stock: 45,
    tags: ['hair-oil', 'smoothing', 'frizz-control']
  },

  // Fragrance
  {
    name: 'The Body Shop White Musk Eau de Toilette',
    description: 'Soft, sensual fragrance with notes of lily, jasmine, and musk. Long-lasting and suitable for everyday wear.',
    price: 1295,
    originalPrice: 1595,
    category: 'Fragrance',
    brand: 'The Body Shop',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'
    ],
    stock: 35,
    featured: true,
    tags: ['perfume', 'musk', 'floral']
  },
  {
    name: 'Bath & Body Works Japanese Cherry Blossom Fragrance Mist',
    description: 'Light, refreshing body mist with Japanese cherry blossom fragrance. Perfect for a subtle, all-day scent.',
    price: 999,
    originalPrice: 1299,
    category: 'Fragrance',
    brand: 'Bath & Body Works',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'
    ],
    stock: 50,
    tags: ['body-mist', 'cherry-blossom', 'floral']
  },

  // Bath & Body
  {
    name: 'The Body Shop Vitamin E Intense Moisture Cream',
    description: 'Rich, nourishing body cream with Vitamin E. Provides 48-hour hydration and leaves skin soft and smooth.',
    price: 995,
    originalPrice: 1195,
    category: 'Bath & Body',
    brand: 'The Body Shop',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500'
    ],
    stock: 60,
    featured: true,
    tags: ['body-cream', 'vitamin-e', 'moisturizing']
  },
  {
    name: 'Palmolive Aroma Shower Gel - Lavender & Vanilla',
    description: 'Rich, creamy shower gel with lavender and vanilla extracts. Gently cleanses while leaving skin soft and fragrant.',
    price: 99,
    originalPrice: 149,
    category: 'Bath & Body',
    brand: 'Palmolive',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500'
    ],
    stock: 150,
    bestSeller: true,
    tags: ['shower-gel', 'lavender', 'aromatic']
  },

  // Men's Products
  {
    name: 'Nivea Men Deep Impact Shaving Foam',
    description: 'Rich, creamy shaving foam that softens beard and protects skin from razor irritation. Provides a close, smooth shave.',
    price: 199,
    originalPrice: 249,
    category: 'Men',
    brand: 'Nivea Men',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500'
    ],
    stock: 80,
    tags: ['shaving', 'men', 'foam']
  },
  {
    name: 'The Man Company Beard Oil - Cedarwood & Mint',
    description: 'Nourishing beard oil with cedarwood and mint. Softens beard, reduces itchiness, and promotes healthy growth.',
    price: 499,
    originalPrice: 599,
    category: 'Men',
    brand: 'The Man Company',
    images: [
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'
    ],
    stock: 55,
    featured: true,
    tags: ['beard-oil', 'men', 'grooming']
  }
];

const seedProducts = async () => {
  try {
    await connectDB();

    // Clear existing products (optional - comment out if you want to keep existing data)
    await Product.deleteMany({});
    console.log('🗑️  Existing products deleted');

    // Insert seed products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ ${createdProducts.length} products created successfully`);

    // Calculate initial ratings for some products (simulate some reviews)
    for (let i = 0; i < Math.min(5, createdProducts.length); i++) {
      const product = createdProducts[i];
      // Add some dummy reviews for demonstration
      product.rating = (4 + Math.random()).toFixed(1);
      product.numReviews = Math.floor(Math.random() * 50) + 10;
      await product.save();
    }

    console.log('✅ Seed data populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed function
seedProducts();







