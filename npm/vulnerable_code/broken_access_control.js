// broken_access_control.js
// Demonstrates Broken Access Control vulnerabilities (OWASP A01)

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3003;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory "database"
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'user', password: 'password123', role: 'user' }
];

const posts = [
  { id: 1, userId: 1, title: 'Admin Post', content: 'This is a private admin post', isPrivate: true },
  { id: 2, userId: 2, title: 'User Post', content: 'This is a public user post', isPrivate: false },
  { id: 3, userId: 1, title: 'Confidential Data', content: 'Secret company financial information', isPrivate: true }
];

// Simulated authentication middleware
function simulateAuth(req, res, next) {
  const userId = req.headers['user-id'];
  const user = users.find(u => u.id === parseInt(userId));
  
  if (user) {
    req.user = user;
    next();
  } else {
    // VULNERABILITY 1: Default to admin if no user is provided
    // This simulates a broken fallback mechanism
    req.user = users[0]; // Default to admin
    next();
  }
}

app.use(simulateAuth);

// VULNERABILITY 2: Missing permission checks
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === parseInt(id));
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  // VULNERABILITY: No check if the user can access this post
  // Should check if the post is private and belongs to the requesting user
  
  res.json(post);
});

// VULNERABILITY 3: Path traversal vulnerability
app.get('/api/files', (req, res) => {
  const { filename } = req.query;
  
  if (!filename) {
    return res.status(400).json({ error: 'Filename parameter is required' });
  }
  
  // VULNERABILITY: No sanitization of the filename parameter
  // An attacker can use '../' to access files outside the intended directory
  const filePath = path.join(__dirname, 'public', filename);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 4: Missing function level access control
app.post('/api/admin/create-user', (req, res) => {
  const { username, password, role } = req.body;
  
  // VULNERABILITY: No check if the current user is an admin
  // This endpoint should be restricted to admins only
  
  const newUser = {
    id: users.length + 1,
    username,
    password,
    role
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
});

// VULNERABILITY 5: Improper access control in API
app.get('/api/users/:id/data', (req, res) => {
  const { id } = req.params;
  const requestedUser = users.find(u => u.id === parseInt(id));
  
  if (!requestedUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // VULNERABILITY: Broken access control - user ID in URL is not validated against logged-in user
  // An attacker can simply change the ID in the URL to access other users' data
  
  res.json({
    id: requestedUser.id,
    username: requestedUser.username,
    role: requestedUser.role,
    // Include sensitive data that should be protected
    password: requestedUser.password
  });
});

// VULNERABILITY 6: Cross-Origin Resource Sharing (CORS) misconfiguration
app.use((req, res, next) => {
  // VULNERABILITY: Allow any origin to access the API
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// VULNERABILITY 7: Insecure Direct Object Reference (IDOR)
app.get('/api/documents/:docId', (req, res) => {
  const { docId } = req.params;
  
  // VULNERABILITY: No ownership check, just direct lookup by ID
  // An attacker can access any document by guessing IDs
  
  const documents = [
    { id: 1, ownerId: 1, name: 'Admin Document', content: 'Confidential admin data' },
    { id: 2, ownerId: 2, name: 'User Document', content: 'Regular user data' }
  ];
  
  const document = documents.find(d => d.id === parseInt(docId));
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  res.json(document);
});

// VULNERABILITY 8: Security Misconfiguration - Debug endpoints exposed
app.get('/debug/users', (req, res) => {
  // VULNERABILITY: Debug endpoint with no access control
  res.json({
    users: users,
    message: 'Debug endpoint exposed without access control!'
  });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Broken Access Control server running at http://localhost:${PORT}`);
    console.log('WARNING: This server contains intentional vulnerabilities for demonstration!');
    console.log('Available routes:');
    console.log('- GET /api/posts/:id - Missing permission checks');
    console.log('- GET /api/files?filename=example.txt - Path traversal vulnerability');
    console.log('- POST /api/admin/create-user - Missing function level access control');
    console.log('- GET /api/users/:id/data - Improper access control in API');
    console.log('- GET /api/documents/:docId - Insecure Direct Object Reference');
    console.log('- GET /debug/users - Security Misconfiguration');
  });
}

module.exports = app;
