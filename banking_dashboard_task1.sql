CREATE TYPE kyc_status_enum AS ENUM ('unverified', 'verified');

CREATE TYPE account_type_enum AS ENUM 
('savings', 'checking', 'credit_card', 'loan', 'investment');

CREATE TYPE txn_type_enum AS ENUM ('debit', 'credit');

CREATE TYPE bill_status_enum AS ENUM ('upcoming', 'paid', 'overdue');

CREATE TYPE alert_type_enum AS ENUM 
('low_balance', 'bill_due', 'budget_exceeded');


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    kyc_status kyc_status_enum DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(100),
    account_type account_type_enum,
    masked_account VARCHAR(20),
    currency CHAR(3),
    balance NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
    description VARCHAR(255),
    category VARCHAR(100),
    amount NUMERIC(12,2),
    currency CHAR(3),
    txn_type txn_type_enum,
    merchant VARCHAR(100),
    txn_date TIMESTAMP,
    posted_date TIMESTAMP
);


CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    month INT,
    year INT,
    category VARCHAR(100),
    limit_amount NUMERIC(12,2),
    spent_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    biller_name VARCHAR(100),
    due_date DATE,
    amount_due NUMERIC(12,2),
    status bill_status_enum,
    auto_pay BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    program_name VARCHAR(100),
    points_balance INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type alert_type_enum,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES users(id),
    action TEXT,
    target_type VARCHAR(50),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';




