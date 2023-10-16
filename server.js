// ----- Module Imports -----
const bcrypt = require('bcrypt');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '.env') });
const cron = require('node-cron');
const fetch = require('node-fetch');
const db = require('./src/database/dbConnection');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const cors = require('cors');
const fs = require('fs');

// ----- Server Initialization -----
const app = express();
const PORT = process.env.PORT || 4000;

// ----- Middleware Configuration -----
app.use(express.json());
app.use(cors());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// ----- Passport Google OAuth2.0 Setup -----
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// ----- User Serialization for Session Handling -----
passport.serializeUser((user, done) => {
  done(null, user.id);  // only store user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    // Fetch the user by ID from the database
    const [users] = await db.execute('SELECT userID, username, dateRegistered, icon FROM User WHERE userID = ?', [id]);
    if (users.length === 0) {
      return done(null, false);  // No user found
    }
    const user = users[0];
    done(null, { id: user.userID, displayName: user.username, dateRegistered: user.dateRegistered, icon: user.icon });  // Pass user data to req.user
  } catch (error) {
    done(error);
  }
});

// ----- Authentication Middleware -----
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  } else {
    res.status(401).json({ success: false, message: "Not authenticated" });
  }
}

// ----- View Engine Setup -----
// Use ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));


// ----- Static Assets Serving -----
// Middleware to serve assets directory which is inside 'src' directory
app.use('/assets', express.static(path.join(__dirname, 'src', 'assets')));

// Serve icons from a specific directory
app.use('/assets/images/icons', express.static(path.join(__dirname, 'src', 'assets', 'images', 'icons')));

// ----- Form Data Parsing -----
// Middleware to parse incoming request bodies from auth forms
app.use(express.urlencoded({ extended: true }));

// ----- Route Definitions -----

// Default Route (GET: /)
// -----------------------
// This route renders the authentication page
app.get('/', (req, res) => {
  res.render('Auth');
});

// Home Page (GET: /Home)
// ----------------------
// This route renders the home page and passes the user's information
app.get('/Home', (req, res) => {
  res.render('Home', { user: req.user });
});

// Character Encyclopedia Page (GET: /CharacterEncyclopedia)
// --------------------------------------------------------
// Renders the character encyclopedia page and passes the user's information
app.get('/CharacterEncyclopedia', (req, res) => {
  res.render('characterEncyclopedia', { user: req.user });
});

// Hero Metrics Page (GET: /HeroMetrics)
// ------------------------------------
// Renders the hero metrics page and passes the user's information
app.get('/HeroMetrics', (req, res) => {
  res.render('heroMetrics', { user: req.user });
});

// Story of the Day Page (GET: /StoryOfTheDay)
// -------------------------------------------
// Renders the Story Of The Day page
// First, it fetches a story from the Marvel API. If no valid story is retrieved,
// it fetches a random evergreen story from the database
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

// Character Bookmarks Page (GET: /CharacterBookmarks)
// ---------------------------------------------------
// Renders the character bookmarks page and passes the user's information
app.get('/CharacterBookmarks', (req, res) => {
  res.render('characterBookmarks', { user: req.user });
});

// Edit Profile Page (GET: /EditProfile)
// -------------------------------------
// An authenticated route that renders the user's profile editing page
// It fetches the user's icon filename from the database and passes it to the frontend
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


// Analytics Page (GET: /Analytics)
// -------------------------------
// Renders the analytics page and passes the user's information
app.get('/Analytics', (req, res) => {
  res.render('analytics', { user: req.user });
});


// Support Page (GET: /Support)
// ---------------------------
// Renders the support page and passes the user's information
app.get('/Support', (req, res) => {
  res.render('support', { user: req.user });
});

// Authentication Page (GET: /Auth)
// -------------------------------
// Renders the authentication page (Sign Up / Log In)
app.get('/Auth', (req, res) => {
  res.render('auth');
});

// Google Authentication Routes
// ----------------------------
// Initiates the Google OAuth2.0 authentication process
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Handles the callback after Google authentication
// On failure, redirects back to the authentication page
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/Auth' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/Home');
});

// Login Route (POST: /handleLogin)
// -------------------------------
// Handles user login using a POST request
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

// Signup Route (POST: /handleSignup)
// -----------------------------------
// This route handles user registration
// It checks for an existing user based on the username or email
// Hashes the user's password, and inserts the new user into the database
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

// Logout Route (GET: /logout)
// ---------------------------
// This route handles the user logout process by destroying the session
// After successful logout, the user is redirected to the authentication page
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if(err) {
          console.log("Error : Failed to destroy the session during logout.", err);
      }
      res.redirect('/Auth');  // Redirect to the Auth page after logout
  });
});

// Background Job for Fetching Stories
// -----------------------------------
// A daily cron job that fetches stories from the Marvel API and caches them
// This job is scheduled to run at midnight every day
cron.schedule('0 0 * * *', async () => {
  const stories = await fetchMultipleStoriesFromMarvelAPI();
  myCache.set("stories", stories);
});

// Fetch Story Route (GET: /fetch-story)
// -------------------------------------
// An asynchronous route that fetches a story from an external function URL
// This might be used for periodic story updates or fetching additional stories
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

// Marvel API Integration Setup
// ----------------------------
// Constants for the public and private Marvel API keys.
// These are used to authenticate and fetch data from the Marvel API.
const publicKey = process.env.MARVEL_PUBLIC_KEY;
const privateKey = process.env.MARVEL_PRIVATE_KEY;

// Function: fetchMultipleStoriesFromMarvelAPI
// -------------------------------------------
// This function fetches multiple stories from the Marvel API.
// It constructs the Marvel API URL with the necessary authentication parameters,
// retrieves the stories, and selects one random story to return.
const fetchMultipleStoriesFromMarvelAPI = async () => {
  const timestamp = Date.now().toString();

  const hash = crypto.createHash('md5').update(timestamp + privateKey + publicKey).digest('hex');

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

// Fetch Icons Route (GET: /fetch-icons)
// -------------------------------------
// This route reads the icons directory on the server
// and sends the list of available icon filenames to the frontend
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


// Update Icon Route (POST: /updateIcon)
// -------------------------------------
// This authenticated route updates the user's profile icon in the database
// It retrieves the new icon filename from the request body and updates the corresponding user record
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


// Update Username Route (POST: /updateUsername)
// ---------------------------------------------
// This route allows users to update their username.
// It first checks if the new username is already taken in the database.
// If the username is available, it updates the user's record in the database.
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

// Update Password Route (POST: /updatePassword)
// ---------------------------------------------
// This route allows users to update their password.
// It verifies the user's current password against the stored hash in the database.
// If the current password matches, it hashes the new password and updates the database.
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

// Delete Account Route (POST: /deleteAccount)
// -------------------------------------------
// This route allows users to delete their account from the database.
// After successful deletion, the user's session is destroyed.
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


app.post('/comments', ensureAuthenticated, async (req, res) => {
  const { characterID, commentContent } = req.body;
  const userID = req.user.id;

  try {
    // Fetch the current timestamp on the server
    const timestamp = Date.now().toString();

    // Check if characterID exists in Characters table
    let [rows] = await db.execute('SELECT characterID FROM Characters WHERE characterID = ?', [characterID]);

    if (rows.length === 0) {
      // If characterID not found, fetch the characterName from the Marvel API
      const publicKey = process.env.MARVEL_PUBLIC_KEY;
      const privateKey = process.env.MARVEL_PRIVATE_KEY;
      const apiKey = publicKey; // Use the publicKey as the API key
      const hashValue = crypto.createHash('md5').update(timestamp + privateKey + publicKey).digest('hex');

      const url = `https://gateway.marvel.com:443/v1/public/characters/${characterID}?ts=${timestamp}&apikey=${apiKey}&hash=${hashValue}`;
      const response = await fetch(url);
      const jsonData = await response.json();

      // Debugging: Log the response data
      console.log("Marvel API Response:", jsonData);

      // Check if the response contains the expected data structure
      if (jsonData.data && jsonData.data.results && jsonData.data.results.length > 0) {
        const characterName = jsonData.data.results[0].name;

        // Insert the characterID and characterName into Characters table
        await db.execute('INSERT INTO Characters (characterID, characterName) VALUES (?, ?)', [characterID, characterName]);
      } else {
        console.error("Marvel API response does not have the expected structure.");
        res.json({ success: false, message: 'Error adding comment. Character not found.' });
        return;
      }
    }

    // Now, insert the comment
    await db.execute('INSERT INTO Comments (characterID, userID, commentContent, datePosted, upvotes) VALUES (?, ?, ?, NOW(), 0)', [characterID, userID, commentContent]);
    res.json({ success: true, message: 'Comment added successfully!' });
  } catch (error) {
    console.error("Error while adding comment:", error);
    res.json({ success: false, message: 'Error adding comment.' });
  }
});



app.get('/comments/:characterID', async (req, res) => {
  const characterID = req.params.characterID;

  try {
      const [comments] = await db.execute(`
      SELECT 
          c.commentID, c.datePosted, c.commentContent, c.upvotes,
          u.username, u.icon
      FROM 
          Comments c
      JOIN 
          User u ON c.userID = u.userID
      WHERE 
          c.characterID = ? 
      ORDER BY 
          c.datePosted DESC
    `, [characterID]);
    console.log('Fetched comments:', comments); // Add this line
    res.json(comments);
} catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Error fetching comments.' });
}

});

app.delete('/comments/:commentId', ensureAuthenticated, async (req, res) => {
  const commentId = req.params.commentId;
  const userID = req.user.id;

  try {
      await db.execute('DELETE FROM Comments WHERE commentID = ? AND userID = ?', [commentId, userID]);
      res.json({ success: true, message: 'Comment deleted successfully!' });
  } catch (error) {
      console.error(error);
      res.json({ success: false, message: 'Error deleting comment.' });
  }
});


app.put('/comments/upvote/:commentId', async (req, res) => {
  const commentId = req.params.commentId;

  try {
      await db.execute('UPDATE Comments SET upvotes = upvotes + 1 WHERE commentID = ?', [commentId]);
      res.json({ success: true, message: 'Comment upvoted successfully!' });
  } catch (error) {
      res.json({ success: false, message: 'Error upvoting comment.' });
  }
});


app.put('/comments/:commentId', ensureAuthenticated, async (req, res) => {
  const { content } = req.body;
  const commentId = req.params.commentId;
  const userID = req.user.id;

  try {
      await db.execute('UPDATE Comments SET content = ? WHERE commentID = ? AND userID = ?', [content, commentId, userID]);
      res.json({ success: true, message: 'Comment updated successfully!' });
  } catch (error) {
      res.json({ success: false, message: 'Error updating comment.' });
  }
});




// Start the server and print the port it's running on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
