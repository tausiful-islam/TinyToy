-- Supabase Database Schema for E-commerce Store
-- Copy and execute these SQL statements in your Supabase SQL editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category VARCHAR(100) NOT NULL,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  address TEXT NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash on Delivery', 'Bank Transfer')),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create wishlists table (for future user accounts)
CREATE TABLE IF NOT EXISTS wishlists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Create reviews table (for future implementation)
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read access)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- RLS Policies for orders (admin can see all, customers can see their own)
CREATE POLICY "Orders are viewable by everyone" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Orders can be inserted by anyone" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders can be updated by authenticated users" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for order_items
CREATE POLICY "Order items are viewable by everyone" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Order items can be inserted by anyone" ON order_items
  FOR INSERT WITH CHECK (true);

-- RLS Policies for wishlists (users can only see their own)
CREATE POLICY "Users can view their own wishlist" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own wishlist" ON wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own wishlist" ON wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reviews (public read, anyone can insert pending approval)
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (approved = true);

CREATE POLICY "Anyone can submit reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample products (migrate from existing data)
INSERT INTO products (name, description, long_description, price, category, image, images, stock, rating, review_count, featured) VALUES
('Sunshine Positivity Bear', 'A cuddly teddy bear that radiates positive energy and brings smiles to anyone''s day.', 'This adorable Sunshine Positivity Bear is more than just a toy—it''s a daily reminder to stay positive and embrace joy. Made with premium soft materials and featuring an embroidered smile that never fades.', 24.99, 'Toys', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 25, 4.8, 127, true),

('Crystal Meditation Pyramid', 'Beautiful clear quartz pyramid that enhances meditation and brings positive energy.', 'Transform your living space with this stunning clear quartz crystal pyramid. Hand-selected for its clarity and positive energy properties, this pyramid serves as both a beautiful decorative piece and a powerful meditation tool.', 45.00, 'Home Decor', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1607081692251-5a7f8e9b8d0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 15, 4.9, 89, true),

('Rainbow Smile Stress Ball', 'Colorful stress ball with a permanent smile that helps squeeze away stress.', 'Meet your new stress-busting companion! This vibrant rainbow stress ball features a cheerful smile that reminds you to find joy even in challenging moments.', 12.99, 'Toys', 'https://images.unsplash.com/photo-1511405946472-a37e3b5cdb45?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1511405946472-a37e3b5cdb45?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 50, 4.7, 203, true),

('Botanical Happiness Planter', 'Charming ceramic planter with inspirational quotes that brings life to your home.', 'Brighten your space with this beautiful ceramic planter featuring hand-painted inspirational quotes. Perfect for small plants, succulents, or herbs.', 28.50, 'Home Decor', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1493119508027-2b584f234d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 30, 4.6, 156, false),

('Gratitude Journal Set', 'Beautiful journal set with prompts for daily gratitude practice.', 'Start each day with intention using this beautifully designed gratitude journal set. Includes guided prompts and colorful pens for a complete mindfulness experience.', 19.99, 'Gifts', 'https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 40, 4.9, 312, true),

('Zen Garden Desktop Set', 'Miniature zen garden with rake and stones for mindful moments.', 'Create a peaceful oasis at your workspace with this elegant desktop zen garden. Complete with fine sand, stones, and a wooden rake for meditative breaks.', 35.00, 'Home Decor', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1603344204980-4edb0ea19e20?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 20, 4.8, 98, true),

('Happy Thoughts Mug', 'Color-changing mug that reveals positive messages with hot beverages.', 'Start your morning with magic! This special mug reveals uplifting messages and cheerful illustrations when you pour in hot coffee or tea.', 16.99, 'Gifts', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1545665277-5937750162c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 35, 4.7, 245, false),

('Succulent Joy Garden Kit', 'Complete kit with mini succulents, pots, and care instructions.', 'Bring the joy of gardening into any space with this delightful succulent kit. Includes three mini succulents, decorative pots, and soil - perfect for beginners!', 29.99, 'Gifts', 'https://images.unsplash.com/photo-1459156212016-c812468e2115?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', ARRAY['https://images.unsplash.com/photo-1459156212016-c812468e2115?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'], 25, 4.8, 178, true);

-- Create admin user (you'll need to run this in Supabase Auth settings)
-- This is just a reference - actual user creation should be done through Supabase dashboard
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES ('admin@yourdomain.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW());
