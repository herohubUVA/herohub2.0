const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Use ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middleware to serve assets directory which is inside 'src' directory
app.use('/assets', express.static(path.join(__dirname, 'src', 'assets')));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/Home', (req, res) => {
  res.render('home');
});

app.get('/CharacterEncyclopedia', (req, res) => {
  res.render('characterEncyclopedia');
});

app.get('/HeroMetrics', (req, res) => {
  res.render('heroMetrics');
});

app.get('/StoryOfTheDay', (req, res) => {
  res.render('storyOfTheDay');
});

app.get('/CharacterBookmarks', (req, res) => {
  res.render('characterBookmarks');
});

// Start the server and print the port it's running on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
