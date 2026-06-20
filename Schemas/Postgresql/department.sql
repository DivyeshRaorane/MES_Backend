-- Department master table

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  d_name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
