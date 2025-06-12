// auth_and_crypto_vulnerabilities.js
// Demonstrates Broken Authentication and Cryptographic Failures vulnerabilities (OWASP A02 & A07)

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken'); // Not in dependencies, simulation only
const bodyParser = require('body-parser');
const lodash = require('lodash'); // Vulnerable version in package.json
const cookie = require('cookie'); // Simulation only

const app = express();
const PORT = 3002;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory "database" for demonstration purposes
const users = [
  { id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com', role: 'admin' },
  { id: 2, username: 'user', password: 'password123', email: 'user@example.com', role: 'user' }
];

// VULNERABILITY 1: HARD-CODED CREDENTIALS
// Never store credentials in source code
const API_KEY = "1a2b3c4d5e6f7g8h9i0j";
const DB_PASSWORD = "super_secure_db_password";

// VULNERABILITY 2: WEAK HASHING ALGORITHM (MD5)
// MD5 is considered cryptographically broken
function hashPasswordMD5(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// VULNERABILITY 3: INSECURE JWT IMPLEMENTATION
// Using a weak, hardcoded secret and improper options
function generateInsecureJWT(user) {
  // Using a weak secret
  const secret = 'secret123';
  
  // No expiration, no algorithm specification
  return jwt.sign({ 
    userId: user.id,
    role: user.role
  }, secret);
}

// VULNERABILITY 4: NO BRUTE FORCE PROTECTION
// No rate limiting to prevent credential stuffing or brute force attacks
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Find user without rate limiting
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate insecure token
  const token = generateInsecureJWT(user);
  
  // VULNERABILITY 5: INSECURE COOKIE SETTINGS
  // Missing secure, httpOnly, SameSite flags
  res.setHeader('Set-Cookie', cookie.serialize('authToken', token, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    // Missing secure: true, httpOnly: true, and sameSite: 'strict'
  }));
  
  res.json({
    message: 'Login successful',
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// VULNERABILITY 6: WEAK PASSWORD STORAGE
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password, and email are required' });
  }
  
  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  // VULNERABILITY: Storing passwords in plain text
  const newUser = {
    id: users.length + 1,
    username,
    password, // Plain text password storage!
    email,
    role: 'user'
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'User registered successfully',
    user: { id: newUser.id, username: newUser.username, role: newUser.role }
  });
});

// VULNERABILITY 7: SENSITIVE DATA EXPOSURE (OWASP A02)
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === parseInt(id));
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // VULNERABILITY: Exposing sensitive information
  // Returns all user information including password
  res.json(user);
});

// VULNERABILITY 8: INSECURE DIRECT OBJECT REFERENCE (IDOR)
app.get('/api/user-profile/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === parseInt(id));
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // VULNERABILITY: No authorization check
  // Any user can access any other user's profile by changing the ID
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });
});

// VULNERABILITY 9: IMPROPER CERTIFICATE VALIDATION (Simulated)
function simulateInsecureTLSConnection() {
  // This is a simulation of ignoring certificate validation
  console.log('WARNING: TLS certificate validation disabled!');
  return {
    // Simulated options that would disable certificate validation
    rejectUnauthorized: false,
    requestCert: false,
    agent: false
  };
}

// VULNERABILITY 10: INADEQUATE ENCRYPTION (Using weak algorithm)
app.post('/api/encrypt-data', (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: 'Data is required for encryption' });
  }
  
  // VULNERABILITY: Using DES which is considered weak
  try {
    const key = Buffer.from('12345678'); // 8-byte key for DES (weak)
    const iv = Buffer.from('87654321');  // 8-byte IV for DES (weak)
    
    const cipher = crypto.createCipheriv('des', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    res.json({
      message: 'Data encrypted with DES (weak algorithm)',
      encryptedData: encrypted,
      warning: 'DES is considered cryptographically weak!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Authentication & Cryptographic Vulnerabilities server running at http://localhost:${PORT}`);
    console.log('WARNING: This server contains intentional vulnerabilities for demonstration!');
    console.log('Available routes:');
    console.log('- POST /api/login - Broken Authentication');
    console.log('- POST /api/register - Weak Password Storage');
    console.log('- GET /api/users/:id - Sensitive Data Exposure');
    console.log('- GET /api/user-profile/:id - Insecure Direct Object Reference');
    console.log('- POST /api/encrypt-data - Weak Encryption');
  });
}

module.exports = app;
