#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, 'ARCHITECTURE_VISUAL.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

console.log('HTML file loaded successfully');
console.log('To convert to PDF, you can use a browser or online converter');
console.log('The HTML file is ready at:', htmlPath);
console.log('\nFor best results, open the HTML file in a browser and use Print to PDF');
