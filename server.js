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
  done(null, user.id);  // only store user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    // Fetch the user by ID from the database
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return done(null, false);  // No user found
    }
    const user = users[0];
    done(null, { id: user.id, displayName: user.username });  // Pass user data to req.user
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

app.get('/CharacterEncyclopedia', (req, res) => {
  res.render('characterEncyclopedia', { user: req.user });
});

app.get('/HeroMetrics', (req, res) => {
  res.render('heroMetrics', { user: req.user });
});

app.get('/StoryOfTheDay', (req, res) => {
  res.render('storyOfTheDay', { user: req.user });
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

      // Set req.user to the authenticated user's data
      req.user = {
        id: user.id,  
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

const fetchMultipleStoriesFromMarvelAPI = async () => {
  // some other function to get multiple stories
};

// Start the server and print the port it's running on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
