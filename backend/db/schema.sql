-- ENUM types
CREATE TYPE kyc_status_enum AS ENUM ('unverified', 'verified');

CREATE TYPE account_type_enum AS ENUM (
  'savings',
  'checking',
  'credit_card',
  'loan',
  'investment'
);

CREATE TYPE txn_type_enum AS ENUM ('debit', 'credit');

CREATE TYPE bill_status_enum AS ENUM ('upcoming', 'paid', 'overdue');

CREATE TYPE alert_type_enum AS ENUM (
  'low_balance',
  'bill_due',
  'budget_exceeded'
);

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  kyc_status kyc_status_enum DEFAULT 'unverified',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE accounts(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_type account_type_enum NOT NULL,
    masked_account VARCHAR(20),
    currency CHAR(3) NOT NULL,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    description VARCHAR(255),
    category VARCHAR(100),
    amount NUMERIC NOT NULL,
    currency CHAR(3) NOT NULL,
    txn_type txn_type_enum NOT NULL,
    merchant VARCHAR(100),
    txn_date TIMESTAMP NOT NULL,
    posted_date TIMESTAMP,

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE
);

-- Budgets table
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    category VARCHAR(100),
    limit_amount NUMERIC NOT NULL,
    spent_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Bills table
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC NOT NULL,
    status bill_status_enum DEFAULT 'upcoming',
    auto_pay BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bills_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Rewards table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    program_name VARCHAR(100) NOT NULL,
    points_balance INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rewards_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type alert_type_enum NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alerts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Admin Logs table
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT,
    action TEXT NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_adminlogs_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
);