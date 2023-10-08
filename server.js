const bcrypt = require('bcrypt');
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 4000;
const cron = require('node-cron');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const db = require('./src/database/dbConnection');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');

app.use(session({
  secret: 'your_session_secret', // Choose a secret for session
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));
console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Client Secret:", process.env.GOOGLE_CLIENT_SECRET);

passport.serializeUser((user, done) => {
  console.log("User:", user)
  done(null, user.id);  // only store user ID in the session
});

passport.deserializeUser(async (id, done) => {
  console.log("DS: ", id);
  try {
    // Fetch the user by ID from the database
    const [users] = await db.execute('SELECT userID, username, dateRegistered FROM User WHERE userID = ?', [id]);
    if (users.length === 0) {
      return done(null, false);  // No user found
    }
    const user = users[0];
    done(null, { id: user.userID, displayName: user.username, dateRegistered: user.dateRegistered });  // Pass user data to req.user
  } catch (error) {
    done(error);
  }
});


// Use ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middleware to serve assets directory which is inside 'src' directory
app.use('/assets', express.static(path.join(__dirname, 'src', 'assets')));

// Middleware to parse incoming request bodies from auth forms
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.render('Auth');
});

app.get('/Home', (req, res) => {
  res.render('Home', { user: req.user });
});


app.get('/CharacterEncyclopedia', (req, res) => {
  res.render('characterEncyclopedia', { user: req.user });
});

app.get('/CharacterBookmarks', (req, res) => {
  res.render('characterBookmarks', { user: req.user });
});

app.get('/HeroMetrics', (req, res) => {
  res.render('heroMetrics', { user: req.user });
});

app.get('/StoryOfTheDay', async (req, res) => {
  let story = await fetchMultipleStoriesFromMarvelAPI();
  let error = null;

  if (!story) {
      // Fetch a random evergreen story from the database if no valid story from Marvel API
      const [rows] = await db.execute('SELECT * FROM evergreen_stories ORDER BY RAND() LIMIT 1');
      console.log("Fetched evergreen story:", rows);
      story = rows[0];
  }

  if (!story) {
      // If still no story, handle the error gracefully
      console.log("Story is still not defined after fetching from DB:", story);
      error = "Unable to fetch a story at this time.";
  }
  console.log("Rendering with:", {story: story, error: error});
  res.render('storyOfTheDay', { user: req.user, story: story, error: error });
});



app.get('/CharacterBookmarks', (req, res) => {
  res.render('characterBookmarks', { user: req.user });
});

app.get('/EditProfile', (req, res) => {
  res.render('editProfile', { user: req.user });
});

app.get('/Analytics', (req, res) => {
  res.render('analytics', { user: req.user });
});

app.get('/Support', (req, res) => {
  res.render('support', { user: req.user });
});

app.get('/Auth', (req, res) => {
  res.render('auth');
});

// Route to start Google authentication
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Route for Google authentication callback
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/Auth' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/Home');
});


app.post('/handleLogin', async (req, res) => {
  const { username, password } = req.body;

  try {
      // Check if the user exists
      const [users] = await db.execute('SELECT * FROM User WHERE username = ?', [username]);

      if (users.length === 0) {
          return res.status(400).send('User not found.');
      }

      const user = users[0];

      // Check if the entered password matches the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(400).send('Incorrect password.');
      }

      // Set req.user to the authenticated user's data
      req.user = {
        id: user.userID,  
        displayName: user.username
    };    
    
    // Login the user and start the session
    req.login(req.user, function(err) {
        if (err) {
            console.error('Error during session initiation:', err);
            return res.status(500).send('Server error.');
        }
        // Redirect to the home page
        res.redirect('/Home');
    });

  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send('Server error.');
  }
});


app.post('/handleSignup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
      // Check for existing user
      const [existingUsers] = await db.execute('SELECT * FROM User WHERE username = ? OR email = ?', [username, email]);
      
      if (existingUsers.length > 0) {
          return res.status(400).send('Username or email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user into the database
      await db.execute('INSERT INTO User (username, email, password, dateRegistered) VALUES (?, ?, ?, NOW())', [username, email, hashedPassword]);

      // Redirect user to auth page or somwhere else
      res.redirect('/Auth');

  } catch (error) {
      console.error('Error during signup:', error);
      res.status(500).send('Server error.');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if(err) {
          console.log("Error : Failed to destroy the session during logout.", err);
      }
      res.redirect('/Auth');  // Redirect to the Auth page after logout
  });
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

const publicKey = process.env.MARVEL_PUBLIC_KEY;
const privateKey = process.env.MARVEL_PRIVATE_KEY;

const fetchMultipleStoriesFromMarvelAPI = async () => {
  const timestamp = Date.now().toString();

  // Generate the MD5 hash
  const hash = crypto.createHash('md5').update(timestamp + privateKey + publicKey).digest('hex');

  // Construct the Marvel API URL
  const url = `https://gateway.marvel.com:443/v1/public/stories?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;

  const storiesResponse = await fetch(url); 
  const storiesData = await storiesResponse.json();

  // Extract stories and select a random one
  const stories = storiesData.data.results;
  const randomStory = stories[Math.floor(Math.random() * stories.length)];

  // Check if the random story is valid (has description, characters, and image)
  if (randomStory && randomStory.description && randomStory.characters.items.length > 0) {
      return {
          title: randomStory.title,
          description: randomStory.description,
          characters: randomStory.characters.items.map(char => char.name).join(', '),
          image_url: `${randomStory.thumbnail.path}.${randomStory.thumbnail.extension}`
      };
  }

  return null;
};


// Start the server and print the port it's running on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
