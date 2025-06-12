// insecure_design_and_integrity.js
// Demonstrates Insecure Design (OWASP A04) and Software and Data Integrity Failures (OWASP A08)

const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const app = express();
const PORT = 3006;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// VULNERABILITY 1: INSECURE DESIGN - Weak business logic
// In-memory user database with reset functionality
let users = [
  { id: 1, username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { id: 2, username: 'user', email: 'user@example.com', password: 'password123', role: 'user' }
];

// VULNERABILITY 2: INSECURE DESIGN - Missing rate limiting
// This function simulates a login with no rate limiting
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // VULNERABILITY: No rate limiting or account lockout mechanism
  // Attackers can brute force passwords unlimited times
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials',
      warning: 'This endpoint has no rate limiting or account lockout mechanism!'
    });
  }
});

// VULNERABILITY 3: INSECURE DESIGN - Password recovery design flaw
app.post('/api/reset-password', (req, res) => {
  const { username } = req.body;
  
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // VULNERABILITY: Using a sequential, predictable token
  // No requirement for old password validation
  const resetToken = Date.now().toString();
  
  // VULNERABILITY: Sending token directly in the response
  // Should send via email instead
  res.json({
    message: 'Password reset initiated',
    username: username,
    resetToken: resetToken, 
    warning: 'Reset token is predictable and exposed directly in the API response!'
  });
});

// VULNERABILITY 4: INSECURE DESIGN - Overly complex design
// This function does too many things at once, making security issues harder to spot
app.post('/api/process-user-data', (req, res) => {
  const { userData, options, actions, filters, transforms } = req.body;
  
  try {
    let result = userData;
    
    // VULNERABILITY: Overly complex processing with many options
    if (options && options.validate) {
      // Complex validation logic
    }
    
    if (transforms && transforms.length > 0) {
      transforms.forEach(transform => {
        // Apply dynamic transformations based on user input
        if (transform.type === 'eval' && transform.code) {
          // VULNERABILITY: Executing arbitrary code from user input
          result = eval(`(function() { const data = ${JSON.stringify(result)}; ${transform.code}; return data; })()`);
        }
      });
    }
    
    if (actions && actions.saveToFile) {
      // VULNERABILITY: Saving user data to file without proper validation
      const filepath = actions.filepath || './user_data.json';
      fs.writeFileSync(filepath, JSON.stringify(result));
    }
    
    res.json({
      result,
      warning: 'This endpoint has an overly complex design with multiple security vulnerabilities!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 5: SOFTWARE INTEGRITY - Insecure deserialization
app.post('/api/load-config', (req, res) => {
  const { configData } = req.body;
  
  try {
    // VULNERABILITY: Unsafe deserialization of user input
    const config = eval(`(${configData})`);
    
    res.json({
      config,
      applied: true,
      warning: 'This endpoint uses unsafe deserialization (eval)!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 6: SOFTWARE INTEGRITY - Lack of integrity verification
// Let's simulate auto-update functionality without signature verification
app.get('/api/check-update', (req, res) => {
  // VULNERABILITY: No verification of update source or signature
  res.json({
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    downloadUrl: 'http://malicious-site.example.com/update.zip',
    warning: 'This endpoint provides updates without source verification or signature validation!'
  });
});

// VULNERABILITY 7: SOFTWARE INTEGRITY - Using untrusted CDN with SRI
app.get('/api/load-page', (req, res) => {
  // VULNERABILITY: Loading script from CDN without integrity checking
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vulnerable Page</title>
      <!-- Missing Subresource Integrity (SRI) hashes -->
      <script src="https://cdn.example.com/vulnerable-library.js"></script>
    </head>
    <body>
      <h1>Page loaded with scripts from untrusted CDN</h1>
      <p>This page loads JavaScript libraries without SRI checks</p>
    </body>
    </html>
  `;
  
  res.send(htmlContent);
});

// VULNERABILITY 8: CI/CD PIPELINE INTEGRITY FAILURE (Simulated)
app.get('/api/deployment-info', (req, res) => {
  // Simulating CI/CD pipeline with security issues
  res.json({
    pipelineConfig: {
      name: 'production-deploy',
      triggers: ['push-to-master'],
      tests: {
        security: false, // No security testing
        unit: true,
        integration: true
      },
      dependencies: {
        verify: false // No dependency verification
      },
      secrets: {
        stored: 'plaintext', // Secrets stored in plaintext
        management: 'hardcoded' // Hardcoded secrets
      }
    },
    warning: 'This application simulates a CI/CD pipeline without proper security controls!'
  });
});

// VULNERABILITY 9: INSECURE DESIGN - Assumption of single users per account
app.post('/api/update-settings', (req, res) => {
  const { userId, settings } = req.body;
  
  // VULNERABILITY: No concurrency control
  // If two sessions update the same settings simultaneously, race conditions occur
  
  // Simulated update without concurrency control
  res.json({
    userId,
    settingsUpdated: true,
    warning: 'This endpoint has no concurrency control, leading to race conditions!'
  });
});

// VULNERABILITY 10: DATA INTEGRITY - Unsigned cookies
app.get('/api/set-user-cookie', (req, res) => {
  // VULNERABILITY: Using unsigned cookies for sensitive data
  // Attacker can modify these values client-side
  res.cookie('user_id', '123', { httpOnly: false });
  res.cookie('user_role', 'admin', { httpOnly: false });
  
  res.json({
    message: 'Cookies set without integrity protection',
    warning: 'Using unsigned cookies for sensitive data allows tampering!'
  });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Insecure Design & Software Integrity server running at http://localhost:${PORT}`);
    console.log('WARNING: This server contains intentional vulnerabilities for demonstration!');
    console.log('Available routes:');
    console.log('- POST /api/login - Insecure Design (No Rate Limiting)');
    console.log('- POST /api/reset-password - Insecure Design (Password Recovery Flaw)');
    console.log('- POST /api/process-user-data - Insecure Design (Overly Complex Design)');
    console.log('- POST /api/load-config - Software Integrity (Insecure Deserialization)');
    console.log('- GET /api/check-update - Software Integrity (No Update Verification)');
    console.log('- GET /api/load-page - Software Integrity (Missing SRI)');
    console.log('- GET /api/deployment-info - CI/CD Pipeline Integrity Failure');
    console.log('- POST /api/update-settings - Insecure Design (Race Conditions)');
    console.log('- GET /api/set-user-cookie - Data Integrity (Unsigned Cookies)');
  });
}

module.exports = app;
