// injection_vulnerabilities.js
// Demonstrates SQL Injection and Command Injection vulnerabilities (OWASP A03)

const express = require('express');
const { exec } = require('child_process');
const mongoose = require('mongoose'); // Vulnerable version from package.json
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection (This won't actually connect without a real MongoDB server)
mongoose.connect('mongodb://localhost:27017/vulnerable_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(err => console.error('MongoDB connection error:', err));

// Create a basic user schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  isAdmin: Boolean
});

const User = mongoose.model('User', UserSchema);

// VULNERABILITY 1: SQL INJECTION
// This function simulates a SQL query being built with string concatenation
// Never do this in real code - use parameterized queries instead!
function simulateSqlQuery(username) {
  // This is a simulated SQL query, doesn't actually run
  const sqlQuery = `SELECT * FROM users WHERE username = '${username}'`;
  console.log(`Executing SQL query: ${sqlQuery}`);
  
  // Simulating the response for demonstration
  if (username.includes("' OR '1'='1")) {
    return { message: "SQL INJECTION SUCCESSFUL! All user records would be returned." };
  } else {
    return { message: `Query executed for username: ${username}` };
  }
}

// VULNERABILITY 2: NoSQL INJECTION
// Route that's vulnerable to NoSQL injection
app.post('/api/users/find', async (req, res) => {
  const { username } = req.body;
  
  try {
    // VULNERABLE: Using user input directly in a query without validation
    // An attacker could send: {"username": {"$ne": null}} to get all users
    const users = await User.find({ username: username });
    
    // For demonstration, we'll simulate the response
    if (typeof username === 'object' && username.$ne) {
      return res.json({ 
        vulnerable: true, 
        message: 'NoSQL Injection detected! This would return all users in the database.'
      });
    }
    
    res.json({ users: [], message: 'Query executed without NoSQL injection' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VULNERABILITY 3: COMMAND INJECTION
// Route that's vulnerable to command injection
app.get('/ping', (req, res) => {
  const { host } = req.query;
  
  if (!host) {
    return res.status(400).json({ error: 'Host parameter is required' });
  }

  // VULNERABLE: Directly using user input in a command
  // An attacker could use: ?host=google.com;rm -rf /
  const command = `ping -c 1 ${host}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ 
      command: command,
      output: stdout,
      warning: 'This endpoint is vulnerable to command injection!'
    });
  });
});

// VULNERABILITY 4: UNSAFE DESERIALIZATION
// Route that's vulnerable to unsafe deserialization
app.post('/api/deserialize', (req, res) => {
  const { serializedData } = req.body;
  
  try {
    // VULNERABLE: eval() is extremely dangerous
    // An attacker could inject malicious code
    const deserializedData = eval('(' + serializedData + ')');
    
    res.json({
      message: 'Data deserialized',
      data: deserializedData,
      warning: 'This endpoint is vulnerable to unsafe deserialization and code injection!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Injection Vulnerabilities server running at http://localhost:${PORT}`);
    console.log('WARNING: This server contains intentional vulnerabilities for demonstration!');
    console.log('Available routes:');
    console.log('- POST /api/users/find - NoSQL Injection');
    console.log('- GET /ping?host=example.com - Command Injection');
    console.log('- POST /api/deserialize - Unsafe Deserialization');
    console.log('- GET /sql-injection?username=yourname - SQL Injection simulation');
  });
}

// Example route to demonstrate SQL Injection
app.get('/sql-injection', (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ 
      error: 'Username parameter is required',
      hint: "Try with ?username=admin' OR '1'='1"
    });
  }
  
  const result = simulateSqlQuery(username);
  res.json(result);
});

module.exports = app;
