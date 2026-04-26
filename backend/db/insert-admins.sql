-- =============================================================================
-- Insert Admin Users for TagakTuro Portal
-- =============================================================================
-- Password: TagakTuro2025
-- BCrypt Hash: $2a$10$YourBCryptHashHere (replace with actual hash)
-- =============================================================================

USE tagakturo;

-- Generate BCrypt hash for password "TagakTuro2025" using:
-- Option 1: https://bcrypt-generator.com/ (paste password and click Hash)
-- Option 2: Java code - see HashGenerator.java
-- Option 3: Run the HashGenerator.java file in backend

-- Replace the hash below with the actual BCrypt hash

INSERT INTO users (name, email, password, roles, created_at) 
VALUES 
  (
    'OVPSSCD Admin',
    'TagakOVPSSCD@umak.edu.ph',
    '$2a$10$3qGSXa7p8x9K2zL1mN4pQOh6wP9rV8sT3dL4kJ5yM6nO7pQ8rS9tU',
    'ROLE_ADMIN',
    NOW()
  ),
  (
    'CCED Admin',
    'TagakCCED@gmail.com',
    '$2a$10$3qGSXa7p8x9K2zL1mN4pQOh6wP9rV8sT3dL4kJ5yM6nO7pQ8rS9tU',
    'ROLE_ADMIN',
    NOW()
  );

-- Verify insertion
SELECT id, name, email, roles FROM users WHERE email IN ('TagakOVPSSCD@umak.edu.ph', 'TagakCCED@gmail.com');
