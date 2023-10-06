const bcrypt = require('bcrypt');
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
const cron = require('node-cron');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const db = require('./src/database/dbConnection');

// Use ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middleware to serve assets directory which is inside 'src' directory
app.use('/assets', express.static(path.join(__dirname, 'src', 'assets')));

// Middleware to parse incoming request bodies from auth forms
app.use(express.urlencoded({ extended: true }));


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

app.get('/Auth', (req, res) => {
  res.render('auth');
});
app.post('/handleLogin', async (req, res) => {
  const { username, password } = req.body;

  try {
      // Check if the user exists
      const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

      if (users.length === 0) {
          return res.status(400).send('User not found.');
      }

      const user = users[0];

      // Check if the entered password matches the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(400).send('Incorrect password.');
      }

      // User is authenticated. You can create a session, issue a token, or simply redirect the user to a dashboard or home page
      res.redirect('/Home'); // Redirecting to home page for simplicity

  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send('Server error.');
  }
});


app.post('/handleSignup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
      // Check for existing user
      const [existingUsers] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
      
      if (existingUsers.length > 0) {
          return res.status(400).send('Username or email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user into the database
      await db.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

      // Redirect user to auth page or somwhere else
      res.redirect('/Auth');

  } catch (error) {
      console.error('Error during signup:', error);
      res.status(500).send('Server error.');
  }
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
