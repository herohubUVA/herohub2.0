// Import required modules
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware to serve assets directory
app.use('/assets', express.static(path.resolve(__dirname, 'assets')));

// Middleware to serve static files from 'src/pages/Home' directory
app.use(express.static(path.resolve(__dirname, 'src/pages/Home')));

// Middleware to serve static files from 'public' directory
app.use(express.static('public'));

// Middleware to serve static files from 'src/pages/CharacterEncyclopedia' directory
app.use('/CharacterEncyclopedia', express.static(path.resolve(__dirname, 'src/pages/CharacterEncyclopedia')));

// Middleware to serve static files from 'src' directory
app.use(express.static(__dirname + '/src'));

// Start the server and print the port it's running on
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
