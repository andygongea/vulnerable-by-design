// ssrf_and_logging_failures.js
// Demonstrates Server-Side Request Forgery (OWASP A10) and Logging/Monitoring Failures (OWASP A09)

const express = require('express');
const request = require('request'); // Vulnerable version specified in package.json
const axios = require('axios'); // Vulnerable version in package.json
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const winston = require('winston'); // Latest version
const bodyParser = require('body-parser');
const url = require('url');

const app = express();
const PORT = 3007;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// VULNERABILITY 1: SSRF - Unvalidated URL in request module
app.get('/api/fetch-resource', (req, res) => {
  const { resource } = req.query;
  
  if (!resource) {
    return res.status(400).json({ error: 'Resource parameter is required' });
  }
  
  // VULNERABILITY: No validation on the resource URL
  // Attacker can use this to access internal resources
  // Examples: http://localhost:3000/admin or http://internal-network:8080/
  
  request(resource, (error, response, body) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.send({
      status: response.statusCode,
      body: body,
      warning: 'This endpoint is vulnerable to Server-Side Request Forgery (SSRF)!'
    });
  });
});

// VULNERABILITY 2: SSRF - Bypassing localhost restrictions with DNS
app.post('/api/fetch-url', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  // VULNERABILITY: Weak validation - only checks for "localhost" string
  // Attacker can bypass with DNS or IP representation
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return res.status(403).json({ error: 'Accessing localhost is not allowed' });
  }
  
  // VULNERABILITY: Attacker can use alternative localhost representations:
  // - 0.0.0.0
  // - 127.0.0.2
  // - 0177.0000.0000.0001
  // - 2130706433 (decimal representation of 127.0.0.1)
  // - subdomain.localhost.example.com (DNS rebinding)
  
  // This would be a real HTTP request in a vulnerable application
  console.log(`Simulating request to: ${url}`);
  
  // For demonstration, we'll simulate a successful response
  res.json({
    message: 'Request simulated',
    url: url,
    warning: 'This endpoint is vulnerable to SSRF through localhost restriction bypass!'
  });
});

// VULNERABILITY 3: SSRF - Vulnerable file URL
app.get('/api/preview-file', (req, res) => {
  const { file } = req.query;
  
  if (!file) {
    return res.status(400).json({ error: 'File parameter is required' });
  }
  
  try {
    // VULNERABILITY: Accepting file:// protocol
    // This could allow reading local files on the server
    const parsedUrl = new URL(file);
    
    if (parsedUrl.protocol === 'file:') {
      // For simulation, we'll just warn about the vulnerability
      return res.json({
        warning: 'SSRF vulnerability detected! The file:// protocol would allow reading local server files!',
        requestedFile: file
      });
    }
    
    // For demonstration only
    res.json({
      message: 'File preview requested',
      url: file
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 4: LOGGING FAILURE - Insufficient logging
// Set up a minimal logger with insufficient details
const minimalLogger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
});

app.post('/api/admin/actions', (req, res) => {
  const { action, target } = req.body;
  const userId = req.headers['user-id'] || 'unknown';
  
  // VULNERABILITY: Critical action with insufficient logging
  // No IP address, full request details, or timestamp
  minimalLogger.info(`User performed action: ${action}`);
  
  // Simulate administrative action
  res.json({
    message: `Admin action '${action}' performed on target '${target}'`,
    warning: 'This endpoint has insufficient logging for critical administrative actions!'
  });
});

// VULNERABILITY 5: LOGGING FAILURE - Missing error logging
app.get('/api/risky-operation', (req, res) => {
  try {
    // Simulate an operation that might fail
    const result = performRiskyOperation();
    res.json({ result });
  } catch (error) {
    // VULNERABILITY: Error occurs but not logged anywhere
    // This makes troubleshooting and security monitoring difficult
    
    res.status(500).json({ 
      error: 'Operation failed',
      warning: 'This endpoint does not log errors, making it difficult to detect attacks!'
    });
  }
});

// Helper function for the risky operation
function performRiskyOperation() {
  // Simulated operation that always succeeds for demonstration
  return { status: 'success', data: { id: 123, timestamp: new Date().toISOString() } };
}

// VULNERABILITY 6: LOGGING FAILURE - Sensitive data in logs
app.post('/api/users/register', (req, res) => {
  const { username, password, creditCard, ssn } = req.body;
  
  // VULNERABILITY: Logging sensitive data
  console.log(`New user registration: ${username}, Password: ${password}, Credit Card: ${creditCard}, SSN: ${ssn}`);
  
  res.json({ 
    message: 'User registered',
    warning: 'This endpoint logs sensitive data including passwords and financial information!'
  });
});

// VULNERABILITY 7: LOGGING FAILURE - Log Injection
app.get('/api/log-message', (req, res) => {
  const { message } = req.query;
  
  if (!message) {
    return res.status(400).json({ error: 'Message parameter is required' });
  }
  
  // VULNERABILITY: Unsanitized user input in log messages
  // Attacker can inject fake log entries or perform CRLF injection
  console.log(`User message: ${message}`);
  
  res.json({
    logged: true,
    warning: 'This endpoint is vulnerable to log injection!'
  });
});

// VULNERABILITY 8: SSRF - Arbitrary URL redirection
app.get('/redirect', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  // VULNERABILITY: Unvalidated redirection
  // Attacker can redirect to malicious sites
  // Or use internal URLs to probe the network
  res.redirect(url);
});

// VULNERABILITY 9: SSRF - XML External Entity (XXE) Processing
app.post('/api/process-xml', (req, res) => {
  const { xml } = req.body;
  
  if (!xml) {
    return res.status(400).json({ error: 'XML content is required' });
  }
  
  // VULNERABILITY: This simulates vulnerability to XXE attacks
  // Real implementation would use a vulnerable XML parser with entities enabled
  
  // For demonstration only
  if (xml.includes('<!ENTITY') && xml.includes('SYSTEM')) {
    return res.json({
      warning: 'XXE vulnerability detected! This would allow attackers to read local files or perform SSRF attacks.',
      xmlContent: xml
    });
  }
  
  res.json({
    message: 'XML processed successfully',
    note: 'To test XXE vulnerability, include ENTITY declarations with SYSTEM in your XML'
  });
});

// VULNERABILITY 10: LOGGING FAILURE - Inadequate monitoring
// This function would be vulnerable due to lack of monitoring capabilities
app.get('/api/monitoring-status', (req, res) => {
  res.json({
    loggingImplemented: true,
    monitoringImplemented: false,
    alertingImplemented: false,
    securityEvents: {
      tracked: false,
      alerts: false,
      retention: '1 day' // Inadequate retention period
    },
    warning: 'This application has inadequate monitoring and alerting capabilities!'
  });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SSRF & Logging Failures server running at http://localhost:${PORT}`);
    console.log('WARNING: This server contains intentional vulnerabilities for demonstration!');
    console.log('Available routes:');
    console.log('- GET /api/fetch-resource?resource=url - SSRF Vulnerability');
    console.log('- POST /api/fetch-url - SSRF with localhost bypass');
    console.log('- GET /api/preview-file?file=url - SSRF with file:// protocol');
    console.log('- POST /api/admin/actions - Insufficient Logging');
    console.log('- GET /api/risky-operation - Missing Error Logging');
    console.log('- POST /api/users/register - Sensitive Data in Logs');
    console.log('- GET /api/log-message?message=text - Log Injection');
    console.log('- GET /redirect?url=url - Arbitrary URL Redirection');
    console.log('- POST /api/process-xml - XXE Processing');
    console.log('- GET /api/monitoring-status - Inadequate Monitoring');
  });
}

module.exports = app;
