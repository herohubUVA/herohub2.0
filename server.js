const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the Home directory as the root
app.use(express.static(path.join(__dirname, 'src/pages/Home')));


// Serve static files from the CharacterEncyclopedia directory
app.use('/CharacterEncyclopedia', express.static(path.join(__dirname, 'src/pages/CharacterEncyclopedia')));

// Serve other static files from the "public" directory
app.use(express.static('public'));

// Route to Character Encyclopedia (from navigation bar)
app.get('/CharacterEncyclopedia', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/pages/CharacterEncyclopedia/index.html'));
});

// Route for the CharacterEncyclopedia (this may be redundant since the static middleware above might handle this)
app.get('/CharacterEncyclopedia', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/pages/CharacterEncyclopedia/index.html'));
});




// Print port that the server is running on
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
