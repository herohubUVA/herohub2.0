const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Serve static files from the CharacterEncyclopedia directory
app.use('/CharacterEncyclopedia', express.static(path.join(__dirname, 'src/pages/CharacterEncyclopedia')));


// Simple route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/src/pages/CharacterEncyclopedia', (req, res) => {
    res.sendFile(path.join(__dirname, '/src/pages/CharacterEncyclopedia/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
