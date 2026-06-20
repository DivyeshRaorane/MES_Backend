CREATE TABLE user_departments (
  id SERIAL PRIMARY KEY,
  emp_id VARCHAR(50) NOT NULL,
  department_id INT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (emp_id) REFERENCES users(emp_id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,

  UNIQUE (emp_id, department_id)
);