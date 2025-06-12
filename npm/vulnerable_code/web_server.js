// web_server.js
// Demonstrates usage of express, ejs, request, moment, chalk, debug, winston.

const express = require('express');
const request = require('request'); // Vulnerable version specified in package.json
const ejs = require('ejs');
const moment = require('moment'); // Vulnerable version
const chalk = require('chalk'); // Uses wildcard, might pull a vulnerable version
const debug = require('debug')('http'); // Vulnerable version
const winston = require('winston'); // 'latest' could be problematic
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Create a 'views' directory for EJS templates

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// Middleware for logging requests
app.use((req, res, next) => {
    logger.info(`Request received: ${req.method} ${req.url} at ${moment().format()}`);
    debug(`Path: ${req.path}, Query: ${JSON.stringify(req.query)}`);
    next();
});

// Create a dummy views/index.ejs file
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)){
    fs.mkdirSync(viewsDir);
}
fs.writeFileSync(path.join(viewsDir, 'index.ejs'), 
    '<h1>Hello <%= name %>!</h1><p>Time: <%= time %></p><p>External Data: <pre><%= externalData %></pre></p>'
);
fs.writeFileSync(path.join(viewsDir, 'error.ejs'), 
    '<h1>Error</h1><p><%= message %></p>'
);

// Routes
app.get('/', (req, res) => {
    const name = req.query.name || 'Guest';
    // Using vulnerable moment version
    const currentTime = moment().format('MMMM Do YYYY, h:mm:ss a'); 
    
    // Using vulnerable request package
    request('http://jsonplaceholder.typicode.com/todos/1', (error, response, body) => {
        let externalData = 'Could not fetch data.';
        if (!error && response.statusCode == 200) {
            try {
                externalData = JSON.stringify(JSON.parse(body), null, 2);
            } catch (e) {
                externalData = 'Error parsing external data.';
                logger.error('Error parsing JSON from external API: ' + e.message);
            }
        }
        res.render('index', { 
            name: name, 
            time: currentTime, 
            externalData: externalData 
        });
    });
});

app.get('/test-chalk', (req, res) => {
    console.log(chalk.blue('This is a blue message from Chalk!'));
    console.log(chalk.red.bold('This is a bold red message!'));
    console.log(chalk.green('Query params: ') + chalk.yellow(JSON.stringify(req.query)));
    res.send('Chalk test messages logged to console.');
});

// Error handling middleware (example)
app.use((err, req, res, next) => {
    logger.error('Unhandled error: ' + err.message, { stack: err.stack });
    res.status(500).render('error', { message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(chalk.green(`Server is running on ${chalk.bold(`http://localhost:${PORT}`)}`));
    logger.info(`Server started on port ${PORT}`);
});

// To run this file: node vulnerable_code/web_server.js
// Then open your browser to http://localhost:3000
// You might need to create the 'views' directory and 'index.ejs', 'error.ejs' files manually if issues occur.
// I've added code to create them, but permissions can sometimes be an issue.
