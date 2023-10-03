const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
const cron = require('node-cron');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');

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

app.get('/Test', (req, res) => {
  res.render('test');
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

app.get('/Login', (req, res) => {
  res.render('login');
});


// Background job
cron.schedule('0 0 * * *', async () => {
  const stories = await fetchMultipleStoriesFromMarvelAPI();
  myCache.set("stories", stories);
});

app.get('/fetch-story', async (req, res) => {
  try {
    const functionURL = 'https://us-east4-herohub-399200.cloudfunctions.net/fetch_stories';
    const functionResponse = await fetch(functionURL);
    const storyData = await functionResponse.json();
    res.json(storyData);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).send('Error fetching story.');
  }
});

const fetchMultipleStoriesFromMarvelAPI = async () => {
  // some other function to get multiple stories
};

// Start the server and print the port it's running on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
