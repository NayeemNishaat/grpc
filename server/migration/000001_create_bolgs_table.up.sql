CREATE TABLE blogs (
  id SERIAL PRIMARY KEY, 
  author VARCHAR (255), 
  title VARCHAR (255), 
  content TEXT, 
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
