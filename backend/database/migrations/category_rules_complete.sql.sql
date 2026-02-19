-- ============================================
-- COMPLETE CATEGORY RULES MIGRATION
-- Creates table and seeds default data
-- ============================================

-- Drop existing table if any
DROP TABLE IF EXISTS category_rules CASCADE;

-- Create table (user_id nullable for system defaults)
CREATE TABLE category_rules (
    id SERIAL PRIMARY KEY,
    user_id INT,
    category_name VARCHAR(50) NOT NULL,
    keywords TEXT[],
    merchants TEXT[],
    is_default BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_category_rules_user_id ON category_rules(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_category_rules_priority ON category_rules(priority);

-- Insert default categories with NULL user_id (system defaults)
INSERT INTO category_rules (user_id, category_name, keywords, merchants, is_default, priority) VALUES
(NULL, 'Food & Dining', ARRAY['coffee', 'cafe', 'restaurant', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'biryani', 'snacks', 'dining', 'takeaway', 'delivery', 'cuisine'], ARRAY['Starbucks', 'Cafe Coffee Day', 'CCD', 'Barista', 'McDonald''s', 'McDonalds', 'KFC', 'Burger King', 'Subway', 'Dominos', 'Pizza Hut', 'Zomato', 'Swiggy', 'Uber Eats', 'Barbeque Nation', 'Haldirams', 'Theobroma'], TRUE, 100),
(NULL, 'Groceries', ARRAY['grocery', 'groceries', 'vegetables', 'fruits', 'milk', 'bread', 'supermarket', 'provisions', 'kirana', 'daily needs', 'household', 'fresh produce', 'dairy'], ARRAY['Big Bazaar', 'D-Mart', 'Reliance Fresh', 'More Megastore', 'Spencer''s', 'Star Bazaar', 'BigBasket', 'Grofers', 'Blinkit', 'Zepto', 'Dunzo', 'JioMart'], TRUE, 100),
(NULL, 'Shopping', ARRAY['shopping', 'purchase', 'buy', 'order', 'shop', 'store', 'mall', 'retail', 'clothes', 'apparel', 'fashion', 'accessories'], ARRAY['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Meesho', 'Zara', 'H&M', 'Pantaloons', 'Westside', 'Max Fashion', 'Lifestyle', 'Croma', 'Reliance Digital'], TRUE, 100),
(NULL, 'Transportation', ARRAY['uber', 'ola', 'taxi', 'cab', 'fuel', 'petrol', 'diesel', 'metro', 'bus', 'train', 'auto', 'parking', 'toll', 'ride', 'commute'], ARRAY['Uber', 'Ola', 'Rapido', 'Indian Oil', 'IOCL', 'Bharat Petroleum', 'BPCL', 'HP Petrol', 'Shell', 'BMTC', 'Delhi Metro', 'Mumbai Metro'], TRUE, 100),
(NULL, 'Utilities', ARRAY['electricity', 'bill', 'recharge', 'mobile', 'phone', 'internet', 'broadband', 'wifi', 'water', 'gas', 'cylinder', 'utility', 'postpaid', 'prepaid'], ARRAY['BESCOM', 'BSES', 'Tata Power', 'Airtel', 'Jio', 'Vi', 'Vodafone', 'BSNL', 'ACT Fibernet', 'Tata Sky', 'Dish TV', 'Indane Gas'], TRUE, 100),
(NULL, 'Entertainment', ARRAY['movie', 'cinema', 'concert', 'show', 'streaming', 'subscription', 'entertainment', 'music', 'game', 'gaming', 'netflix', 'spotify', 'theatre'], ARRAY['Netflix', 'Amazon Prime Video', 'Disney+ Hotstar', 'Sony Liv', 'Zee5', 'Spotify', 'YouTube Premium', 'BookMyShow', 'PVR Cinemas', 'INOX'], TRUE, 100),
(NULL, 'Healthcare', ARRAY['hospital', 'doctor', 'clinic', 'medicine', 'pharmacy', 'medical', 'health', 'prescription', 'treatment', 'diagnosis', 'lab test', 'dental'], ARRAY['Apollo Hospital', 'Fortis', 'Max Healthcare', 'MedPlus', 'Apollo Pharmacy', '1mg', 'PharmEasy', 'Netmeds', 'Thyrocare', 'Dr Lal PathLabs'], TRUE, 100),
(NULL, 'Education', ARRAY['course', 'tuition', 'education', 'school', 'college', 'study', 'exam', 'training', 'certification', 'learning', 'fees', 'books'], ARRAY['Coursera', 'Udemy', 'Unacademy', 'BYJU''s', 'Vedantu', 'Toppr', 'Simplilearn', 'UpGrad'], TRUE, 100),
(NULL, 'Insurance & Investments', ARRAY['insurance', 'premium', 'policy', 'investment', 'mutual fund', 'sip', 'stocks', 'shares', 'trading', 'nps', 'ppf'], ARRAY['HDFC Life', 'ICICI Prudential', 'LIC', 'Zerodha', 'Groww', 'Upstox', 'Angel One', 'Paytm Money'], TRUE, 100),
(NULL, 'EMI & Loans', ARRAY['emi', 'loan', 'installment', 'repayment', 'mortgage', 'home loan', 'car loan', 'personal loan'], ARRAY['HDFC Bank EMI', 'ICICI EMI', 'Bajaj Finserv', 'ZestMoney', 'LazyPay'], TRUE, 100),
(NULL, 'Travel & Hotels', ARRAY['flight', 'hotel', 'booking', 'travel', 'vacation', 'holiday', 'trip', 'ticket', 'airline', 'accommodation'], ARRAY['MakeMyTrip', 'Goibibo', 'Cleartrip', 'OYO', 'Airbnb', 'IndiGo', 'Air India', 'SpiceJet', 'Vistara'], TRUE, 100),
(NULL, 'Personal Care', ARRAY['beauty', 'cosmetics', 'makeup', 'skincare', 'salon', 'spa', 'haircut', 'grooming', 'wellness'], ARRAY['Nykaa', 'Purplle', 'Mamaearth', 'Lakme'], TRUE, 100),
(NULL, 'Fitness & Sports', ARRAY['gym', 'fitness', 'workout', 'yoga', 'sports', 'exercise', 'training', 'athletic'], ARRAY['Cult.fit', 'Gold''s Gym', 'Fitness First', 'Decathlon', 'Nike', 'Adidas'], TRUE, 100),
(NULL, 'Charity & Donations', ARRAY['donation', 'charity', 'ngo', 'fundraiser', 'contribute', 'relief fund'], ARRAY['Give India', 'CRY', 'Akshaya Patra'], TRUE, 100),
(NULL, 'Others', ARRAY[]::TEXT[], ARRAY[]::TEXT[], TRUE, 999);

-- Print success message
SELECT 'Migration completed: ' || COUNT(*) || ' categories inserted' as status 
FROM category_rules WHERE is_default = TRUE;

