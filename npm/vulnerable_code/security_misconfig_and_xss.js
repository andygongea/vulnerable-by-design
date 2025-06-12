// security_misconfig_and_xss.js
// Demonstrates Security Misconfiguration (OWASP A05) and Cross-Site Scripting (OWASP A03) vulnerabilities

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3004;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create necessary view files if they don't exist
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
  fs.mkdirSync(viewsDir);
}

// Create a basic XSS-vulnerable template
const xssTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>XSS Vulnerable Page</title>
  <style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  .message { padding: 10px; background-color: #f0f0f0; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>XSS Vulnerable Page</h1>
  <div class="message">
    <%- message %>
  </div>
  <form method="POST" action="/submit-comment">
    <textarea name="comment" rows="4" cols="50" placeholder="Enter your comment"></textarea><br>
    <input type="submit" value="Submit Comment">
  </form>
  <h2>Comments:</h2>
  <% comments.forEach(function(comment) { %>
    <div class="message">
      <!-- VULNERABILITY: Using <%- %> instead of <%= %> and not escaping user input -->
      <%- comment %>
    </div>
  <% }); %>
</body>
</html>
`;

fs.writeFileSync(path.join(viewsDir, 'xss-vulnerable.ejs'), xssTemplate);

// VULNERABILITY 1: SECURITY MISCONFIGURATION - Verbose error messages
app.use((err, req, res, next) => {
  // VULNERABILITY: Displaying detailed error information to users
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    type: err.name
  });
});

// VULNERABILITY 2: SECURITY MISCONFIGURATION - Default accounts
const adminCredentials = {
  username: 'admin',
  password: 'admin'  // Default credentials not changed
};

// VULNERABILITY 3: SECURITY MISCONFIGURATION - Directory listing enabled
app.use('/public', express.static(path.join(__dirname, 'public'), { 
  // VULNERABILITY: Enable directory listing
  index: false
}));

// Store comments in memory for demonstration purposes
let comments = [
  "Welcome to our site!",
  "This is a test comment."
];

// VULNERABILITY 4: REFLECTED CROSS-SITE SCRIPTING (XSS)
app.get('/search', (req, res) => {
  const query = req.query.q || '';
  
  // VULNERABILITY: Directly inserting user input into HTML response
  res.send(`
    <html>
      <head><title>Search Results</title></head>
      <body>
        <h1>Search Results for: ${query}</h1>
        <p>No results found for your search.</p>
        <a href="/search">Back to search</a>
      </body>
    </html>
  `);
});

// VULNERABILITY 5: STORED CROSS-SITE SCRIPTING (XSS)
app.get('/comments', (req, res) => {
  res.render('xss-vulnerable', { 
    message: 'Welcome to our comment section!',
    comments: comments
  });
});

app.post('/submit-comment', (req, res) => {
  const comment = req.body.comment;
  
  // VULNERABILITY: No sanitization of user input before storing
  if (comment) {
    comments.push(comment);
  }
  
  res.redirect('/comments');
});

// VULNERABILITY 6: SECURITY MISCONFIGURATION - Debug mode enabled in production
const isDebugMode = true; // Should be false in production

app.get('/debug-info', (req, res) => {
  // VULNERABILITY: Exposing sensitive debug information
  if (isDebugMode) {
    const debugInfo = {
      environment: 'production',
      serverInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      databaseConfig: {
        host: 'db.example.com',
        user: 'db_user',
        password: 'db_password_123', // Exposing credentials
        database: 'production_db'
      },
      apiKeys: {
        stripe: 'sk_live_example123456789',
        mailchimp: '1ab2c3d4e5f6g7h8i9j0'
      }
    };
    
    res.json(debugInfo);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// VULNERABILITY 7: SECURITY MISCONFIGURATION - Unnecessary features enabled
app.get('/admin-console', (req, res) => {
  // VULNERABILITY: Admin console accessible without authentication
  res.send(`
    <html>
      <head><title>Admin Console</title></head>
      <body>
        <h1>Admin Console</h1>
        <p>This admin console should not be accessible without authentication!</p>
        <ul>
          <li><a href="/admin-console/users">Manage Users</a></li>
          <li><a href="/admin-console/settings">System Settings</a></li>
          <li><a href="/admin-console/logs">View Logs</a></li>
        </ul>
      </body>
    </html>
  `);
});

// VULNERABILITY 8: DOM-BASED XSS
app.get('/profile', (req, res) => {
  res.send(`
    <html>
      <head><title>User Profile</title></head>
      <body>
        <h1>User Profile</h1>
        <div id="welcome-message"></div>
        
        <script>
          // VULNERABILITY: Unsafe use of location.hash without sanitization
          const username = window.location.hash.substring(1);
          document.getElementById('welcome-message').innerHTML = 'Welcome, ' + username + '!';
        </script>
        
        <p>Try adding a hash to the URL, like: #<script>alert('XSS')</script></p>
      </body>
    </html>
  `);
});

// VULNERABILITY 9: SECURITY MISCONFIGURATION - Dangerous HTTP methods enabled
app.use((req, res, next) => {
  // VULNERABILITY: Allowing dangerous HTTP methods
  res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS, TRACE, CONNECT');
  next();
});

// VULNERABILITY 10: SECURITY MISCONFIGURATION - Missing security headers
// Notice the absence of important security headers like:
// - Content-Security-Policy
// - X-Content-Type-Options
// - X-Frame-Options
// - Strict-Transport-Security

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Security Misconfiguration & XSS server running at http://localhost:${PORT}`);
    console.log('WARNING: This server contains intentional vulnerabilities for demonstration!');
    console.log('Available routes:');
    console.log('- GET /search?q=<query> - Reflected XSS');
    console.log('- GET /comments - Stored XSS');
    console.log('- POST /submit-comment - Submit a comment with XSS payload');
    console.log('- GET /debug-info - Security Misconfiguration (Debug Mode)');
    console.log('- GET /admin-console - Unnecessary Features Enabled');
    console.log('- GET /profile#<script>alert("XSS")</script> - DOM-based XSS');
  });
}

module.exports = app;
