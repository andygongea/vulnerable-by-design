// outdated_components.js
// Demonstrates Vulnerable and Outdated Components (OWASP A06)

const express = require('express');
const lodash = require('lodash'); // Vulnerable version in package.json
const jquery = require('jquery'); // Vulnerable version in package.json
const moment = require('moment'); // Vulnerable version in package.json
const axios = require('axios'); // Vulnerable version in package.json
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3005;

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// VULNERABILITY 1: Using vulnerable lodash prototype pollution
// CVE-2019-10744
app.post('/api/merge-objects', (req, res) => {
  const { object1, object2 } = req.body;
  
  try {
    // VULNERABILITY: Using vulnerable lodash.merge
    // Attacker can exploit prototype pollution by passing:
    // {"object1": {}, "object2": {"__proto__": {"polluted": true}}}
    const merged = lodash.merge({}, object1, object2);
    
    res.json({
      merged: merged,
      warning: 'This endpoint is vulnerable to prototype pollution via lodash.merge!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 2: Using vulnerable jQuery (XSS vulnerability)
// Creating a helper function that would be vulnerable if used in browser
// (Simulated for demonstration only)
function simulateJQueryXSS(htmlContent) {
  console.log('jQuery version:', jquery.fn.jquery); // Output the version
  
  // In a browser context, this could be vulnerable to XSS
  // jquery('<div>' + userProvidedContent + '</div>');
  
  return {
    result: 'Simulated jQuery vulnerability in version ' + jquery.fn.jquery,
    warning: 'jQuery versions before 3.5.0 are vulnerable to XSS when processing HTML with nested elements'
  };
}

app.post('/api/jquery-html', (req, res) => {
  const { htmlContent } = req.body;
  
  try {
    const result = simulateJQueryXSS(htmlContent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 3: Using outdated moment.js (vulnerable to ReDOS)
// CVE-2017-18214
app.get('/api/parse-date', (req, res) => {
  const { date } = req.query;
  
  try {
    // VULNERABILITY: Using vulnerable moment.js parser
    // Can lead to Regular Expression Denial of Service (ReDOS)
    const parsedDate = moment(date);
    
    res.json({
      input: date,
      isValid: parsedDate.isValid(),
      formatted: parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD HH:mm:ss') : 'Invalid date',
      warning: 'This endpoint uses a vulnerable version of moment.js susceptible to ReDOS attacks!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 4: Outdated express version with known vulnerabilities
app.get('/api/express-info', (req, res) => {
  res.json({
    expressVersion: '3.0.0', // Very outdated version
    warning: 'This application uses Express 3.0.0 which has known vulnerabilities:',
    knownVulnerabilities: [
      'Possible memory leak',
      'Potential DoS attack vector',
      'Missing security headers by default'
    ]
  });
});

// VULNERABILITY 5: Using vulnerable axios version
// CVE-2019-17571
app.post('/api/axios-request', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    // Simulated request using vulnerable axios version
    // THIS WILL NOT ACTUALLY EXECUTE THE REQUEST
    console.log(`Would make request to: ${url} with axios v0.18.0`);
    
    res.json({
      message: 'Using vulnerable axios v0.18.0',
      warning: 'This version is vulnerable to Server-Side Request Forgery (SSRF) and URL parsing issues'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY 6: Dependency Confusion Attack simulation
app.get('/api/package-info', (req, res) => {
  const packageJson = require('../package.json');
  
  // VULNERABILITY: Exposing internal package dependencies
  // This could help attackers conduct dependency confusion attacks
  res.json({
    packages: packageJson.dependencies,
    devDependencies: packageJson.devDependencies,
    localPackage: 'local-module', // Internal package name
    warning: 'Exposing internal package names enables dependency confusion attacks!'
  });
});

// VULNERABILITY 7: Generating insecure random values using outdated methods
app.get('/api/generate-token', (req, res) => {
  // VULNERABILITY: Using Math.random() for security token generation
  const insecureToken = Math.random().toString(36).substring(2, 15);
  
  res.json({
    token: insecureToken,
    warning: 'Using insecure random number generation for tokens!'
  });
});

// VULNERABILITY 8: npm audit issues demonstration
app.get('/api/npm-audit', (req, res) => {
  res.json({
    vulnerablePackages: [
      {
        name: 'lodash',
        version: '3.10.1',
        vulnerabilities: ['prototype pollution', 'command injection']
      },
      {
        name: 'jquery',
        version: '1.12.4',
        vulnerabilities: ['cross-site scripting']
      },
      {
        name: 'moment',
        version: '2.8.4',
        vulnerabilities: ['regular expression denial of service']
      },
      {
        name: 'express',
        version: '3.0.0',
        vulnerabilities: ['multiple security issues']
      }
    ],
    warning: 'This application has multiple vulnerable dependencies that need updating!'
  });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Vulnerable and Outdated Components server running at http://localhost:${PORT}`);
    console.log('WARNING: This server contains intentional vulnerabilities for demonstration!');
    console.log('Available routes:');
    console.log('- POST /api/merge-objects - Lodash Prototype Pollution');
    console.log('- POST /api/jquery-html - jQuery XSS Vulnerability');
    console.log('- GET /api/parse-date?date=value - Moment.js ReDOS');
    console.log('- GET /api/express-info - Outdated Express');
    console.log('- POST /api/axios-request - Vulnerable Axios');
    console.log('- GET /api/package-info - Dependency Confusion Risk');
    console.log('- GET /api/generate-token - Insecure Random Values');
    console.log('- GET /api/npm-audit - NPM Audit Summary');
  });
}

module.exports = app;
