-- =========================================
-- Modern Digital Banking Dashboard
-- Core Database Schema (PostgreSQL)
-- Author: Anukalp Teaswi (Branch: anukalp_tejaswi)
-- =========================================


-- =========================================
--  (OPTIONAL) DROP TABLES IF THEY ALREADY EXIST IN THE SYSTEM
-- =========================================
DROP TYPE IF EXISTS type_enum CASCADE;
DROP TYPE IF EXISTS status_enum CASCADE;
DROP TYPE IF EXISTS txn_type_enum CASCADE;
DROP TYPE IF EXISTS account_type_enum CASCADE;
DROP TYPE IF EXISTS kyc_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;  -- NEW LINE

-- =========================================
--  REQUIRED ENUM TYPES
-- =========================================

-- KYC STATUS
CREATE TYPE kyc_status_enum AS ENUM ('unverified', 'verified');

-- ACCOUNT TYPE
CREATE TYPE account_type_enum AS ENUM ('savings','checking', 'credit_card', 'loan', 'investment');

-- TRANSACTION TYPE
CREATE TYPE txn_type_enum AS ENUM ( 'debit', 'credit');

-- BILL STATUS
CREATE TYPE status_enum AS ENUM ('upcoming', 'paid', 'overdue');

-- ALERT TYPE
CREATE TYPE type_enum AS ENUM ( 'low_balance', 'bill_due', 'budget_exceeded');

-- USER ROLE (NEW ENUM)
CREATE TYPE user_role_enum AS ENUM ('user', 'admin');


-- =========================================
-- USERS TABLE
-- =========================================
CREATE TABLE USERS(
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
phone VARCHAR(20),
kyc_status kyc_status_enum DEFAULT 'unverified',
role user_role_enum DEFAULT 'user',  -- NEW COLUMN
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ACCOUNTS TABLE
-- =========================================
CREATE TABLE accounts (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL,
bank_name VARCHAR(100) NOT NULL,
account_type account_type_enum NOT NULL,
masked_account VARCHAR(20),
currency CHAR(3) DEFAULT 'INR',
balance NUMERIC (14,2) DEFAULT 0.0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_user_account FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- TRANSACTIONS TABLE
-- =========================================
CREATE TABLE transactions (
id SERIAL PRIMARY KEY,
account_id INT NOT NULL,
description VARCHAR(100),
category VARCHAR(50),
amount NUMERIC(14,2) NOT NULL,
currency CHAR(3) DEFAULT 'INR',
txn_type txn_type_enum NOT NULL,
merchant VARCHAR(50),
txn_date TIMESTAMP NOT NULL,
posted_date TIMESTAMP,
CONSTRAINT fk_transactions_accounts FOREIGN KEY (account_id)
REFERENCES accounts(id) ON DELETE CASCADE
);

-- =========================================
-- BUDGETS TABLE
-- =========================================
CREATE TABLE budgets (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL,
month INT CHECK (month BETWEEN 1 AND 12),
year INT,
category VARCHAR(50),
limit_amount NUMERIC(14,2),
spent_amount NUMERIC(14,2) DEFAULT 0.0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_budgets_users FOREIGN KEY (user_id)
REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- BILLS TABLE
-- =========================================
CREATE TABLE billS (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL,
biller_name VARCHAR(50),
due_date DATE,
amount_due NUMERIC(14,2),
status status_enum DEFAULT 'upcoming',
auto_pay BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_bills_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- REWARDS TABLE
-- =========================================
CREATE TABLE rewards (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL,
program_name VARCHAR(50),
points_balance INT DEFAULT 0,
last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_rewards_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- ALERTS TABLE
-- =========================================
CREATE TABLE alerts(
id SERIAL PRIMARY KEY,
user_id INT NOT NULL,
alert_type type_enum,
message TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_alerts_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- ADMINLOGS TABLE
-- =========================================
CREATE TABLE adminlogs(
id SERIAL PRIMARY KEY,
admin_id INT NOT NULL,
action TEXT,
target_type VARCHAR(50),
target_id INT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_adminlogs_users FOREIGN KEY (admin_id) REFERENCES users(id)
);