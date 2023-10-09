const bcrypt = require('bcrypt');
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 4000;
const cron = require('node-cron');
const fetch = require('node-fetch');
const db = require('./src/database/dbConnection');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
app.use(express.json());
const cors = require('cors');
app.use(cors());
const fs = require('fs');

app.use(session({
  secret: process.env.SESSION_SECRET,
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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  else {
    res.status(401).json({ success: false, message: "Not authenticated" });
  }
}

// Use ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middleware to serve assets directory which is inside 'src' directory
app.use('/assets', express.static(path.join(__dirname, 'src', 'assets')));

// Middleware to parse incoming request bodies from auth forms
app.use(express.urlencoded({ extended: true }));

app.use('/assets/images/icons', express.static(path.join(__dirname, 'src', 'assets', 'images', 'icons')));


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

app.get('/EditProfile', ensureAuthenticated, async (req, res) => {
  try {
    // Retrieve the user's icon filename from the database
    const userId = req.user.id; // Assuming `id` is the user's ID
    const [rows] = await db.execute('SELECT icon FROM User WHERE userID = ?', [userId]);
    
    if (rows.length === 0) {
      // Handle the case where the user's data is not found
      return res.status(404).render('error', { message: 'User not found' });
    }

    const userIconFileName = rows[0].icon;
    
    // Render the 'editProfile' EJS template and pass the user's icon filename
    res.render('editProfile', { user: req.user, userIcon: userIconFileName });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).render('error', { message: 'Server error' });
  }
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

app.get('/fetch-icons', (req, res) => {
  const iconDir = path.join(__dirname, 'src', 'assets', 'images', 'icons');
  fs.readdir(iconDir, (err, files) => {
      if (err) {
          console.error('Error reading icons directory:', err);
          return res.status(500).send('Server error.');
      }
      res.json(files);  // Send the list of files (icons) to the frontend
  });
});



app.post('/updateIcon', ensureAuthenticated, async (req, res) => {
  console.log('Req.user object:', req.user);
  console.log('Req.body:', req.body);
  const userId = req.user && req.user.id;  // Get user ID from the session
  const newIcon = req.body.icon;
  
  try {
    console.log(`newIcon: ${newIcon}, userId: ${userId}`);
    const [result] = await db.execute('UPDATE User SET icon = ? WHERE userID = ?', [newIcon, userId]);
    console.log('Rows affected:', result.affectedRows);

    if (result.affectedRows === 0) {
      // Handle the case where no rows were updated (possibly because the user ID doesn't exist)
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send a success response
    res.json({ success: true, message: "Icon updated successfully!" });
  } catch (error) {
    console.error('Error updating icon:', error);
    res.status(500).json({ success: false, message: "Error updating icon." });
  }
});



app.post('/updateUsername', async (req, res) => {
  console.log('updateUsername endpoint hit'); // Log when endpoint is accessed

  const userId = req.user.id;  // Get user ID from the session
  const newUsername = req.body.newUsername;

  console.log(`Received new username: ${newUsername}`); // Log received username
  
  try {
      // Check if the username is already taken
      console.log('Checking if username is already taken');
      const [existingUsers] = await db.execute('SELECT * FROM User WHERE username = ?', [newUsername]);
      
      if (existingUsers.length > 0) {
          console.log('Username already exists, sending response');
          return res.json({ success: false, message: "Username already exists." });
      }

      // If username is not taken, proceed to update
      console.log('Username is available, proceeding to update');
      await db.execute('UPDATE User SET username = ? WHERE userID = ?', [newUsername, userId]);
      
      console.log('Username updated successfully in database');
      res.json({ success: true, message: "Username updated successfully!" });
  } catch (error) {
      console.error('Error occurred during updateUsername:', error); // Log any errors
      res.json({ success: false, message: "Error updating username." });
  }
});


app.post('/updatePassword', async (req, res) => {
  const userId = req.user.id;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  try {
      const [users] = await db.execute('SELECT password FROM User WHERE userID = ?', [userId]);
      const user = users[0];
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
          return res.json({ success: false, message: "Current password is incorrect." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE User SET password = ? WHERE userID = ?', [hashedPassword, userId]);
      res.json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
      console.error('Error updating password:', error);
      res.json({ success: false, message: "Error updating password." });
  }
});

app.post('/deleteAccount', async (req, res) => {
  const userId = req.user.id;
  
  try {
      await db.execute('DELETE FROM User WHERE userID = ?', [userId]);
      req.session.destroy();  // End the session after deleting the account
      res.json({ success: true, message: "Account deleted successfully!" });
  } catch (error) {
      console.error('Error deleting account:', error);
      res.json({ success: false, message: "Error deleting account." });
  }
});



// Start the server and print the port it's running on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
