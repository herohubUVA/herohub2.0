const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

const serveIndex = require('serve-index');

app.use(express.static(__dirname+'/src'));
app.use('/assets', express.static(path.resolve(__dirname, 'assets')));
app.use(express.static(path.resolve(__dirname, 'src/pages/Home')));
app.use(express.static('public'));
app.use('/CharacterEncyclopedia', express.static(path.resolve(__dirname, 'src/pages/CharacterEncyclopedia')));



// Print port that the server is running on
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
