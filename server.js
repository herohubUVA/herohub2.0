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
const bodyParser = require('body-parser');

// ----- Server Initialization -----
const app = express();
const PORT = process.env.PORT || 4000;

// ----- Middleware Configuration -----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ----- Passport Google OAuth2.0 Setup -----
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const [users] = await db.execute('SELECT * FROM User WHERE email = ?', [email]);

    if (users.length > 0) {
      // User found, log them in
      return done(null, { id: users[0].userID, displayName: users[0].username, dateRegistered: users[0].dateRegistered, icon: users[0].icon });
    } else {
      // No user found with this email address

      // Extract additional information from the profile
      const username = profile.displayName;
      const icon = profile.photos ? profile.photos[0].value : 'spiderman.png';  // Use a default icon if not provided

      // Insert new user into the database
      const [result] = await db.execute('INSERT INTO User (username, email, password, icon, dateRegistered) VALUES (?, ?, ?, ?, NOW())', 
                                        [username, email, '', icon]);

      // Create a user object to pass to done
      const newUser = {
        id: result.insertId,
        displayName: username,
        dateRegistered: new Date(),
        icon: icon
      };

      return done(null, newUser);
    }
  } catch (error) {
    console.error('Error during Google OAuth:', error);
    return done(error);
  }
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
    console.log("User is authenticated");
    return next();
  } else {
    res.redirect('/Auth');
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
  res.render('auth');
});

// Home Page (GET: /Home)
// ----------------------
// This route renders the home page and passes the user's information
app.get('/Home', (req, res) => {
  res.render('home', { user: req.user });
});

// Character Encyclopedia Page (GET: /CharacterEncyclopedia)
// --------------------------------------------------------
// Renders the character encyclopedia page and passes the user's information
app.get('/CharacterEncyclopedia', (req, res) => {
  res.render('characterEncyclopedia', { user: req.user });
});


app.get('/StoryTest', (req, res) => {
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
      story = rows[0];
  }

  if (!story) {
      // If still no story, handle the error gracefully
      console.log("Story is still not defined after fetching from DB:", story);
      error = "Unable to fetch a story at this time.";
  }
  res.render('storyOfTheDay', { user: req.user, story: story, error: error });
});

// Character Bookmarks Page (GET: /CharacterBookmarks)
// ---------------------------------------------------
// Renders the character bookmarks page and passes the user's information

app.get('/characterBookmarks', async (req, res) => {
  const userID = req.user ? req.user.id : null;
  const sortBy = req.query.sortBy; 
  if (!userID) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  let orderByClause = '';
  if (sortBy === 'name') {
    orderByClause = 'ORDER BY Characters.characterName';
  } else { // Default to sorting by date if sortBy is 'date' or undefined
    orderByClause = 'ORDER BY Bookmarks.dateAdded DESC';
  }


  const fetchBookmarksQuery = `
      SELECT 
        Characters.characterName, 
        Characters.characterDescription, 
        Characters.characterID,
        User.username,
        Bookmarks.dateAdded
      FROM Bookmarks 
      INNER JOIN Characters ON Bookmarks.characterID = Characters.characterID 
      INNER JOIN User ON Bookmarks.userID = User.userID
      WHERE Bookmarks.userID = ?
      ${orderByClause};
    `;

  try {
    const [bookmarkedCharacters] = await db.query(fetchBookmarksQuery, [userID]);
    const timestamp = Date.now().toString();
    const publicKey = process.env.MARVEL_PUBLIC_KEY;
    const privateKey = process.env.MARVEL_PRIVATE_KEY;
    const hashValue = crypto.createHash('md5').update(timestamp + privateKey + publicKey).digest('hex');
    const apiKey = publicKey;

    const characterDetailsPromises = bookmarkedCharacters.map(async (bookmark) => {
      const url = `https://gateway.marvel.com:443/v1/public/characters/${bookmark.characterID}?ts=${timestamp}&apikey=${apiKey}&hash=${hashValue}`;
      const response = await fetch(url);
      const jsonData = await response.json();
      const characterFromAPI = jsonData.data.results[0];

      
      return {
        username: bookmark.username,
        characterID: bookmark.characterID, // From Database
        characterName: bookmark.characterName, // From Database
        characterDescription: bookmark.characterDescription, // From Database
        characterImage: `${characterFromAPI.thumbnail.path}.${characterFromAPI.thumbnail.extension}` // From API
      };
    });

    const bookmarksWithImages = await Promise.all(characterDetailsPromises);

    res.render('characterBookmarks', { bookmarks: bookmarksWithImages, user: req.user });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Error fetching bookmarks' });
  }
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
app.get('/Analytics', ensureAuthenticated, (req, res) => {
  res.render('analytics', { user: req.user });
});


// Support Page (GET: /Support)
// ---------------------------
// Renders the support page and passes the user's information
app.get('/Support', (req, res) => {
  res.render('support', { user: req.user });
});

app.get('/websiteReview', (req, res) => {
  res.render('websiteReview', { user: req.user });
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
  const userId = req.user && req.user.id;  // Get user ID from the session
  const newIcon = req.body.icon;
  
  try {
    const [result] = await db.execute('UPDATE User SET icon = ? WHERE userID = ?', [newIcon, userId]);

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
  const userId = req.user.id;  // Get user ID from the session
  const newUsername = req.body.newUsername;
  
  try {
      const [existingUsers] = await db.execute('SELECT * FROM User WHERE username = ?', [newUsername]);
      
      if (existingUsers.length > 0) {
          console.log('Username already exists, sending response');
          return res.json({ success: false, message: "Username already exists." });
      }

      // If username is not taken, proceed to update
      await db.execute('UPDATE User SET username = ? WHERE userID = ?', [newUsername, userId]);
      
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

// Add Comment Route (POST: /comments)
// -----------------------------------
// This authenticated route allows users to add a comment related to a specific Marvel character
// It first checks if the characterID exists in the local database. If not, it fetches the character's name
// from the Marvel API and adds it to the Characters table
// After verifying the character, it then inserts the comment into the Comments table
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

      // Check if the response contains the expected data structure
      if (jsonData.data && jsonData.data.results && jsonData.data.results.length > 0) {
        const characterName = jsonData.data.results[0].name;
        const characterDescription = jsonData.data.results[0].description; 

        // Insert the characterID and characterName into Characters table
        await db.execute('INSERT INTO Characters (characterID, characterName, characterDescription) VALUES (?, ?, ?)', [characterID, characterName, characterDescription]);
      } else {
        console.error("Marvel API response does not have the expected structure.");
        res.json({ success: false, message: 'Error adding comment. Character not found.' });
        return;
      }
    }

    await db.execute('INSERT INTO Comments (characterID, userID, commentContent, datePosted, upvotes) VALUES (?, ?, ?, NOW(), 0)', [characterID, userID, commentContent]);
    res.json({ success: true, message: 'Comment added successfully!' });
  } catch (error) {
    console.error("Error while adding comment:", error);
    res.json({ success: false, message: 'Error adding comment.' });
  }
});


// Get Comments Route (GET: /comments/:characterID)
// -----------------------------------------------
// This route fetches all the comments related to a specific Marvel character
// The comments are joined with the User table to retrieve details about the user who posted the comment
// The results are sorted by the date of posting in descending order
app.get('/comments/:characterID', async (req, res) => {
  const characterID = req.params.characterID;

  try {
      const [comments] = await db.execute(`
      SELECT 
        c.commentID, c.datePosted, c.commentContent, c.upvotes, c.userID,
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
    res.json(comments);
} catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Error fetching comments.' });
}

});

// Delete Comment Route (DELETE: /comments/:commentId)
// --------------------------------------------------
// This authenticated route allows users to delete their own comment
// It checks both the commentID and userID to ensure the user is deleting their own comment
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

// Upvote Comment Route (PUT: /comments/upvote/:commentId)
// -------------------------------------------------------
// This route allows users to upvote a comment
// It increments the upvote count for the specified commentID
app.put('/comments/upvote/:commentId', async (req, res) => {
  const commentId = req.params.commentId;

  try {
      await db.execute('UPDATE Comments SET upvotes = upvotes + 1 WHERE commentID = ?', [commentId]);
      res.json({ success: true, message: 'Comment upvoted successfully!' });
  } catch (error) {
      res.json({ success: false, message: 'Error upvoting comment.' });
  }
});


// Update Comment Route (PUT: /comments/:commentId)
// ------------------------------------------------
// This authenticated route allows users to update the content of their own comment
// It checks both the commentID and userID to ensure the user is updating their own comment
app.put('/comments/:commentId', ensureAuthenticated, async (req, res) => {
  const { content } = req.body;
  const commentId = req.params.commentId;
  const userID = req.user.id;
  console.log(typeof commentId, commentId);

  try {
      const [result] = await db.execute('UPDATE Comments SET commentContent = ? WHERE commentID = ? AND userID = ?', [content, commentId, userID]);
      
      // Check if any rows were affected
      if (result.affectedRows === 0) {
          res.status(400).json({ success: false, message: 'No matching comment found or you do not have permission to edit this comment.' });
      } else {
          res.json({ success: true, message: 'Comment updated successfully!' });
      }
  } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ success: false, message: 'Error editing comment. Please try again.', errorDetail: error.message });
  }
});

// Character Details Fetching from Marvel API
// ------------------------------------------
// This functionality is responsible for fetching a specific Marvel character's details
// using the Marvel API. It is used to ensure that character information is available
// in the local database before any operations related to characters are performed
const fetchCharacterFromMarvelAPI = async (characterID) => {
  const timestamp = Date.now().toString();

  // Create the hash using the timestamp, private key, and public key
  const hash = crypto.createHash('md5').update(timestamp + privateKey + publicKey).digest('hex');

  // Construct the URL to fetch the specific character by its ID
  const url = `https://gateway.marvel.com:443/v1/public/characters/${characterID}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;

  const characterResponse = await fetch(url);
  const characterData = await characterResponse.json();

  // Extract the character details from the API response
  const character = characterData.data.results[0];

  // Return the character details
  return {
      name: character.name,
      description: character.description
  };
};

/**
 * Function: ensureCharacterExists
 * -------------------------------
 * This function checks if a character exists in the local database.
 * If the character does not exist, it fetches the character's details
 * from the Marvel API and inserts them into the database.
 */
const ensureCharacterExists = async (characterID) => {
  const [existingCharacter] = await db.query('SELECT * FROM Characters WHERE characterID = ?', [characterID]);
  console.log('Existing Character:', existingCharacter);
  
  if (existingCharacter.length === 0) {
    const characterDetails = await fetchCharacterFromMarvelAPI(characterID);
    console.log('Fetched Character Details:', characterDetails);
    const [result] = await db.query('INSERT INTO Characters (characterID, characterName, characterDescription) VALUES (?, ?, ?)', [characterID, characterDetails.name, characterDetails.description]);
    console.log('Character Insertion Result:', result);
  }
};



// Submit Rating Route (POST: /submitRating)
// -----------------------------------------
// This route allows authenticated users to submit a rating for a specific Marvel character
// The route expects a characterID and a rating in the request body
// It checks if the user is authenticated and if the necessary information is provided in the request
// If everything is valid, it inserts the rating into the Review table or updates it if it already exists
app.post('/submitRating', async (req, res) => {
  const { characterID, rating } = req.body;
  const userID = req.user ? req.user.id : null;
  console.log('Character ID:', characterID, 'Type:', typeof characterID);

  if (!characterID || !rating) {
    return res.status(400).json({ error: "Character ID and rating are required" });
  }

  if (!userID) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    await ensureCharacterExists(characterID);
    const insertQuery = "INSERT INTO Review (rating, reviewDate, characterID, userID) VALUES (?, NOW(), ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating);";
    await db.query(insertQuery, [rating, characterID, userID]);
    res.status(200).json({ message: "Rating submitted successfully!" });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({ message: "Error submitting rating", error: error.message });
  }
});



// Fetch Average Rating Route (GET: /getRating/:characterID)
// ----------------------------------------------------------
// This route fetches the average rating of a specific Marvel character based on all user ratings
// It expects a characterID as a URL parameter
// The route queries the Review table to calculate and return the average rating
app.get('/getRating/:characterID', async (req, res) => {
  const { characterID } = req.params;
  try {
      const fetchRatingQuery = "SELECT AVG(rating) as averageRating FROM Review WHERE characterID = ?";
      const [rows] = await db.query(fetchRatingQuery, [characterID]);
      
      res.status(200).json(rows[0]);
  } catch (error) {
      res.status(500).json({ message: "Error fetching rating", error });
  }
});


// Get Current User ID Route (GET: /getCurrentUserID)
// ---------------------------------------------------
// This route fetches the userID of the currently authenticated user
// It is useful for front-end applications to determine the current user's state and ID
// If the user is not authenticated, it returns an error message
app.get('/getCurrentUserID', (req, res) => {
  if (req.user && req.user.id) {
      res.json({ userID: req.user.id });
  } else {
      res.json({ error: 'User not logged in' });
  }
});


// Fetch User Rating Route (GET: /getUserRating/:characterID)
// -----------------------------------------------------------
// This route fetches the rating that the currently authenticated user has given to a specific Marvel character
// It expects a characterID as a URL parameter
// If the user is authenticated, it queries the Review table to fetch and return the user's rating
// If no rating is found or the user is not authenticated, it returns an error message
app.get('/getUserRating/:characterID', async (req, res) => {
  const { characterID } = req.params;
  const userID = req.user ? req.user.id : null;
  if (!userID) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const query = 'SELECT rating FROM Review WHERE characterID = ? AND userID = ?';
    const [rows] = await db.query(query, [characterID, userID]);

    if (rows.length > 0) {
      res.status(200).json({ rating: rows[0].rating });
    } else {
      res.status(404).json({ error: 'No rating found for this user and character' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user rating' });
  }
});


// Quizzes Page (GET: /CharacterBookmarks)
// ---------------------------------------------------
// Renders the character bookmarks page and passes the user's information
app.get('/quizzes', (req, res) => {
  res.render('quizzes', {user: req.user });
});

app.get('/superhero_quiz', (req, res) => {

  res.render('superhero_quiz', {user: req.user });
});


app.get('/superpower_quiz', (req, res) => {

  res.render('superpower_quiz', {user: req.user });
});

app.get('/team_quiz', (req, res) => {

  res.render('team_quiz', {user: req.user });
});




const getHeroImage = (heroStyleClass) => {
  // Logic to determine the image URL based on heroStyleClass
  // For example:
  switch(heroStyleClass) {
    case 'captain-america-style':
      return 'assets/images/captain_america_quiz.webp';
    case 'iron-man-style':
      return 'assets/images/Ironman_quiz.jpeg';
    case 'hulk-style':
      return 'asset/images/hulk_quiz.jpg';
    case 'widow-style':
      return 'assets/images/blackwidow_quiz.jpeg';
    case 'spider-style':
      return 'assets/images/Spiderman_quiz.jpeg';
    case 'thor-style':
      return 'assets/images/thor_quiz.jpg';
    case 'witch-style':
      return 'assets/images/scarlett_witch.jpeg';
    default:
      return 'assets/images/agent_shield.jpg';
  }
};

app.post('/submit_quiz', (req, res) => {
  const heroResult = req.query.hero || 'Shield Agent'; // Default to 'Shield Agent' if no hero result is provided
  console.log('Submit');
  // Map hero results to corresponding styles
  const resultStyles = {
    'Captain America': 'captain-america-style',
    'Iron Man': 'iron-man-style',
    'Hulk': 'hulk-style',
    'Scarlett Witch': 'witch-style',
    'Spiderman': 'spider-style',
    'Black Widow': 'widow-style',
    'Thor': 'thor-style',
  };
app.get('/result_superhero', async (req, res) => {
  // const heroResult = req.query.hero || 'Shield Agent'; // Default to 'Shield Agent' if no hero result is provided
  // const userID = req.query.userID; 
  const { answers, userID } = req.body;
  console.log('Before');
  // console.log('Before');
  console.log('userID Check', userID);
  // Map hero results to corresponding styles
  const resultStyles = {
    'Captain America': 'captain-america-style',
    'Iron Man': 'iron-man-style',
    'Hulk': 'hulk-style',
    'Scarlett Witch': 'witch-style',
    'Spiderman': 'spider-style',
    'Black Widow': 'widow-style',
    'Thor': 'thor-style',
  };

  try {
    const safeUserID = userID || null;
    // Check if userID is undefined and handle it by setting it to null
    if (typeof userID === 'undefined') {
      throw new Error('UserID is undefined');
    }
    
    const safeHeroResult = heroResult || null;

    if (typeof heroResult === 'undefined') {
      throw new Error('heroResult is undefined');
    }
   

    const [result] = await db.execute('UPDATE quizHero SET characterName = ? WHERE  userID = ?', [heroResult, userID]);

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      const insertQuery = "INSERT INTO quizHero (userID, characterName) VALUES (?, ?) ON DUPLICATE KEY UPDATE characterName = VALUES(characterName);";
      await db.query(insertQuery, [userID, heroResult]);
    }

    // Get the style class based on the hero result
    const heroStyleClass = resultStyles[heroResult] || 'shield-style';
    const heroImageUrl = getHeroImage(heroStyleClass);
    console.log('Check');
    // Render the result page with the hero result and style class
    res.render('result_superhero', { heroResult, heroStyleClass, heroImageUrl });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({ message: "Error storing quiz result", error: error.message });
  }
});

  // Get the style class based on the hero result
  const heroStyleClass = resultStyles[heroResult] || 'shield-style';
  const heroImageUrl = getHeroImage(heroStyleClass);
  // Render the result page with the hero result and style class

  res.render('result_superhero', { heroResult, heroStyleClass, heroImageUrl});
});

app.get('/result_superhero', (req, res) => {
  const heroResult = req.query.hero || 'Shield Agent'; // Default to 'Shield Agent' if no hero result is provided
  console.log('In result server');
  // Map hero results to corresponding styles
  const resultStyles = {
    'Captain America': 'captain-america-style',
    'Iron Man': 'iron-man-style',
    'Hulk': 'hulk-style',
    'Scarlett Witch': 'witch-style',
    'Spiderman': 'spider-style',
    'Black Widow': 'widow-style',
    'Thor': 'thor-style',
  };

  

  // Get the style class based on the hero result
  const heroStyleClass = resultStyles[heroResult] || 'shield-style';
  const heroImageUrl = getHeroImage(heroStyleClass);
  // Render the result page with the hero result and style class

  res.render('result_superhero', { heroResult, heroStyleClass, heroImageUrl});
});


// Add Bookmark Route (POST: /addBookmark)
// ---------------------------------------
// This route allows authenticated users to add a specific Marvel character to their bookmarks
// The route expects a characterID in the request body
// It checks if the user is authenticated and if the characterID is provided
// The route also checks if the user already has 3 bookmarks, as that is the maximum allowed
// If everything is valid, it inserts the bookmark into the Bookmarks table
app.post('/addBookmark', async (req, res) => {
  const { characterID } = req.body;
  const userID = req.user ? req.user.id : null;

  if (!userID) {
      return res.status(401).json({ error: 'User not authenticated' });
  }

  // Check if user already has 3 bookmarks
  const bookmarkCountQuery = "SELECT COUNT(*) as count FROM Bookmarks WHERE userID = ?";
  const [results] = await db.query(bookmarkCountQuery, [userID]);
  
  // if (results[0].count >= 3) {
  //     return res.status(400).json({ error: 'User can only have 3 bookmarks at once.' });
  // }
  
  const checkQuery = "SELECT COUNT(*) as count FROM Bookmarks WHERE characterID = ? and userID = ?";
  const [bookmarkResults] = await db.query(checkQuery, [characterID, userID]);

  if (bookmarkResults[0].count > 0) {
    return res.status(400).json({ error: 'Bookmark already exists for this user'});
  }

  // Insert new bookmark
  const insertQuery = "INSERT INTO Bookmarks (dateAdded, characterID, userID) VALUES (NOW(), ?, ?)";
  try {
      await db.query(insertQuery, [characterID, userID]);
      res.status(200).json({ message: 'Character bookmarked successfully!' });
  } catch (error) {
      console.error("Detailed Error:", error);
      res.status(500).json({ error: "Error adding bookmark" });
  }
});

// Put Things in the Quizzes Table (POST: /superhero_quiz)
// ------------------------------------------------
app.post('/superhero_quiz', async (req, res) => {
  console.log("post superhero_quiz")
  const { characterName } = req.body;
  const userID = req.user ? req.user.id : null;

  if (!userID) {
      return res.status(401).json({ error: 'User not authenticated' });
  }

  // Insert new bookmark
  const insertQuery = "INSERT INTO quizHero (userID, characterName) VALUES (?, ?)";
  try {
      await db.query(insertQuery, [userID, characterName]);
      res.status(200).json({ message: 'Character bookmarked successfully!' });
  } catch (error) {
      console.error("Detailed Error:", error);
      res.status(500).json({ error: "Error adding bookmark" });
  }
});

// Remove Bookmark Route (DELETE: /removeBookmark)
// ------------------------------------------------
// This route allows authenticated users to remove a specific Marvel character from their bookmarks
// The route expects a characterID in the request body
// It checks if the user is authenticated and if the characterID is provided
// If everything is valid, it removes the bookmark from the Bookmarks table
app.delete('/removeBookmark', async (req, res) => {
  const { characterID } = req.body;
  const userID = req.user ? req.user.id : null;

  if (!userID) {
      return res.status(401).json({ error: 'User not authenticated' });
  }

  // Delete the bookmark
  const deleteQuery = "DELETE FROM Bookmarks WHERE userID = ? AND characterID = ?";
  try {
      await db.query(deleteQuery, [userID, characterID]);
      res.status(200).json({ message: 'Character removed from bookmarks successfully!' });
  } catch (error) {
      console.error("Detailed Error:", error);
      res.status(500).json({ error: "Error removing bookmark" });
  }
});


// Fetch Bookmarks Route (GET: /fetchBookmarks)
// --------------------------------------------
// This route fetches all bookmarked Marvel characters of the currently authenticated user
// It checks if the user is authenticated
// If the user is authenticated, it queries the Bookmarks table to fetch and return all bookmarks
app.get('/fetchBookmarks', async (req, res) => {
  const userID = req.user ? req.user.id : null;

  if (!userID) {
      return res.status(401).json({ error: 'User not authenticated' });
  }

  // Fetch the bookmarks
  const fetchQuery = "SELECT characterID FROM Bookmarks WHERE userID = ?";
  try {
      const [results] = await db.query(fetchQuery, [userID]);
      res.status(200).json({ bookmarks: results });
  } catch (error) {
      console.error("Detailed Error:", error);
      res.status(500).json({ error: "Error fetching bookmarks" });
  }
});


// Highest and Lowest Rated Characters Route (GET: /api/highest-lowest-rated-characters)
// ---------------------------------------------------------------------------------------
// This route fetches the Marvel character with the highest average rating and the character
// with the lowest average rating based on user reviews
// The route returns the characterID, characterName, and averageRating for both characters.
app.get('/api/highest-lowest-rated-characters', async (req, res) => {
  try {
    const [highestRated] = await db.query(`
      SELECT c.characterID, c.characterName, AVG(r.rating) as averageRating
      FROM Characters c
      JOIN Review r ON c.characterID = r.characterID
      GROUP BY c.characterID
      ORDER BY averageRating DESC
      LIMIT 1
    `);
    
    const [lowestRated] = await db.query(`
      SELECT c.characterID, c.characterName, AVG(r.rating) as averageRating
      FROM Characters c
      JOIN Review r ON c.characterID = r.characterID
      GROUP BY c.characterID
      ORDER BY averageRating ASC
      LIMIT 1
    `);
    
    res.json({ highestRated, lowestRated });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Most Commented Characters Route (GET: /api/most-commented-characters)
// ---------------------------------------------------------------------
// This route retrieves the Marvel characters with the most user comments
// The route returns an array of objects, each containing the characterName and commentCount
app.get('/api/most-commented-characters', async (req, res) => {
  try {
    const [results] = await db.query('SELECT c.characterName, COUNT(*) as commentCount FROM Comments com JOIN Characters c ON com.characterID = c.characterID GROUP BY c.characterID ORDER BY commentCount DESC LIMIT 5');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Most Bookmarked Characters Route (GET: /api/most-bookmarked-characters)
// ------------------------------------------------------------------------
// This route fetches Marvel characters with the most bookmarks by users
// The route returns an array of objects, each containing the characterName and bookmarkCount
app.get('/api/most-bookmarked-characters', async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT Characters.characterName, COUNT(Bookmarks.characterID) as bookmarkCount
      FROM Bookmarks
      JOIN Characters ON Bookmarks.characterID = Characters.characterID
      GROUP BY Bookmarks.characterID
      ORDER BY bookmarkCount DESC
      LIMIT 10;
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching most bookmarked characters:', error);
    res.status(500).json({ message: 'Error fetching most bookmarked characters' });
  }
});

// Ratings Over Time Route (GET: /api/ratings-over-time/:characterID)
// -----------------------------------------------------------------
// This route fetches the average ratings over time for a specific Marvel character
// It expects a characterID as a URL parameter
// It returns an array of objects, each containing a date and the averageRating for that date
app.get('/api/ratings-over-time/:characterID', async (req, res) => {
  const { characterID } = req.params;
  console.log('Fetching ratings over time for character ID:', characterID);

  try {
    const [results] = await db.execute(`
      SELECT DATE_FORMAT(reviewDate, '%Y-%m-%d') as date, AVG(rating) as averageRating
      FROM Review
      WHERE characterID = ?
      GROUP BY date
      ORDER BY date;
    `, [characterID]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching ratings over time:', error);
    res.status(500).json({ message: 'Error fetching ratings over time' });
  }
});


// Support Request Route (POST: /support)
// --------------------------------------
// This route allows users to submit support requests
// It expects a JSON body with the fields: name, email, and message
// The route inserts a new support request into the SupportRequests table
// On success, it returns a confirmation message
app.post('/support', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const [results] = await db.execute(
      'INSERT INTO SupportRequests (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    res.status(200).send('Support request submitted successfully');
  } catch (error) {
    console.error('Error handling support request:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/websiteReview', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const [results] = await db.execute(
      'INSERT INTO websiteReview (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    res.status(200).send('Support request submitted successfully');
  } catch (error) {
    console.error('Error handling support request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// User's Highest and Lowest Rated Characters (GET: /api/user-highest-lowest-rated-characters/:userID)
// --------------------------------------------------------------------------------------------------
// This endpoint retrieves the highest and lowest rated Marvel characters for a specific user
// it returns a JSON object containing two properties: highestRated and lowestRated, 
// each with the character details and average rating
app.get('/api/user-highest-lowest-rated-characters/:userID', async (req, res) => {
  const { userID } = req.params;
  try {
    const [highestRated] = await db.query(`
      SELECT c.characterID, c.characterName, AVG(r.rating) as averageRating
      FROM Characters c
      JOIN Review r ON c.characterID = r.characterID
      WHERE r.userID = ?
      GROUP BY c.characterID
      ORDER BY averageRating DESC
      LIMIT 1
    `, [userID]);

    const [lowestRated] = await db.query(`
      SELECT c.characterID, c.characterName, AVG(r.rating) as averageRating
      FROM Characters c
      JOIN Review r ON c.characterID = r.characterID
      WHERE r.userID = ?
      GROUP BY c.characterID
      ORDER BY averageRating ASC
      LIMIT 1
    `, [userID]);

    res.json({ highestRated, lowestRated });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// User's Upvotes Over Time (GET: /api/user-upvotes-over-time/:userID)
// -------------------------------------------------------------------
// This endpoint provides a count of user upvotes (likes) on comments over time
// it returns an array of objects, each with a month and count property
app.get('/api/user-upvotes-over-time/:userID', async (req, res) => {
  const { userID } = req.params;

  try {
    const [upvotes] = await db.query(`
      SELECT DATE_FORMAT(datePosted, '%Y-%m') as month, COUNT(*) as count
      FROM Comments
      WHERE userID = ?
      GROUP BY month
      ORDER BY month
    `, [userID]);

    res.json(upvotes);
  } catch (error) {
    console.error('Error fetching user upvotes over time:', error);
    res.status(500).json({ message: 'Error fetching user upvotes over time' });
  }
});

// User's Top Rated Characters (GET: /api/user-top-rated-characters/:userID)
// ------------------------------------------------------------------------
// This endpoint retrieves the top 5 highest rated Marvel characters by a specific user
// it returns an array of character objects, each with a characterName and averageRating
app.get('/api/user-top-rated-characters/:userID', async (req, res) => {
  const { userID } = req.params;
  try {
    const [results] = await db.query(`
      SELECT c.characterName, AVG(r.rating) as averageRating
      FROM Characters c
      JOIN Review r ON c.characterID = r.characterID
      WHERE r.userID = ?
      GROUP BY c.characterID
      ORDER BY averageRating DESC
      LIMIT 5
    `, [userID]);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// User's Activity Over Time (GET: /api/user-activity-over-time/:userID)
// ---------------------------------------------------------------------
// This endpoint provides a summary of a user's activity over time, including reviews, comments, and bookmarks
// it returns a JSON object with three properties: reviews, comments, and bookmarks, each an array of objects.
app.get('/api/user-activity-over-time/:userID', async (req, res) => {
  const { userID } = req.params;
  try {
    const [reviews] = await db.query(`
      SELECT DATE_FORMAT(reviewDate, '%Y-%m') as month, COUNT(*) as count
      FROM Review
      WHERE userID = ?
      GROUP BY month
      ORDER BY month
    `, [userID]);

    const [comments] = await db.query(`
      SELECT DATE_FORMAT(datePosted, '%Y-%m') as month, COUNT(*) as count
      FROM Comments
      WHERE userID = ?
      GROUP BY month
      ORDER BY month
    `, [userID]);

    const [bookmarks] = await db.query(`
      SELECT DATE_FORMAT(dateAdded, '%Y-%m') as month, COUNT(*) as count
      FROM Bookmarks
      WHERE userID = ?
      GROUP BY month
      ORDER BY month
    `, [userID]);


    res.json({ reviews, comments, bookmarks });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


// Start the server and print the port it's running on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
