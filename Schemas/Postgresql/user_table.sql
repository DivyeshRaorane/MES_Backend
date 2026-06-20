-- User table for login/authentication
-- This tracks who is logged in and performing entries

CREATE TABLE users (
  emp_id VARCHAR(50) PRIMARY KEY,
  emp_name VARCHAR(100) NOT NULL,
  emp_mail_id VARCHAR(150),
  mobile_no VARCHAR(15),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'supervisor', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
