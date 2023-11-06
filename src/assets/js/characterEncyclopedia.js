
// DOM Content Loaded Event Listener
document.addEventListener("DOMContentLoaded", () => {
  console.log('Page loaded');
  fetchAndDisplayUserRating(characterID);
  getRsult();
});


// Access DOM elements
let input = document.getElementById("input-box");
let button = document.getElementById("submit-button");
let listContainer = document.querySelector(".list");


const showContainer = document.getElementById("show-container");

// Get time stamp
let date = new Date();

const [timestamp, apiKey, hashValue] = [ts, publicKey, hashVal];
console.log(`Timestamp: ${timestamp}, API Key: ${apiKey}, Hash: ${hashValue}`);

/**
* Displays the selected value in the input box
* and removes any existing suggestions.
* @param {string} value - The value to be displayed
*/
function displayWords(value) {
  input.value = value;
  removeElements();
}

/**
* Removes elements (search suggestions) from the listContainer.
*/
function removeElements() {
  listContainer.innerHTML = "";
}

// Event listener for showing character suggestions while typing
input.addEventListener("keyup", async () => {
removeElements();

// If input value length is less than 4, exit early
if (input.value.length < 4) {
  return false;
}

const url = `https://gateway.marvel.com:443/v1/public/characters?ts=${timestamp}&apikey=${apiKey}&hash=${hashValue}&nameStartsWith=${input.value}`;
const response = await fetch(url);
const jsonData = await response.json();

jsonData.data["results"].forEach((result) => {
    let name = result.name;
    let div = document.createElement("div");
    div.style.cursor = "pointer";
    div.classList.add("autocomplete-items");
    div.setAttribute("onclick", "displayWords('" + name + "')");
    let word = "<b>" + name.substr(0, input.value.length) + "</b>";
    word += name.substr(input.value.length);
    div.innerHTML = `<p class="item">${word}</p>`;
    listContainer.appendChild(div);
  });
});


let characterID;
let starElements;
let selectedRating = 0;


// Function to display character details, ratings, and comments
async function getRsult() {

if (input.value.trim().length < 1) {
  return alert("Input cannot be blank");
}

showContainer.innerHTML = "";
const url = `https://gateway.marvel.com:443/v1/public/characters?ts=${timestamp}&apikey=${apiKey}&hash=${hashValue}&name=${input.value}`;
const response = await fetch(url);
const jsonData = await response.json();

jsonData.data["results"].forEach((element) => {
  characterID = element.id;
  characterName = element.name; 
  characterDescription = element.description; 
  console.log("Setting characterID:", characterID);
  showContainer.innerHTML = `<div class="card-container">
    <div class="container-character-image">
    <img src="${
      element.thumbnail["path"] + "." + element.thumbnail["extension"]
    }"/></div>
    <div class="character-name">${element.name}</div>
    <div class="character-description">${element.description}</div>
    <div class="button-container">
      <button id="bookmark-button" class="custom-button">Bookmark</button>

      <div class="rating-section">
        <div class="stars">
          <i class="far fa-star" data-rating="1"></i>
          <i class="far fa-star" data-rating="2"></i>
          <i class="far fa-star" data-rating="3"></i>
          <i class="far fa-star" data-rating="4"></i>
          <i class="far fa-star" data-rating="5"></i>
        </div>
        <div class="average-rating">
          Average Rating: <span id="average-rating">N/A</span>
        </div>
        </div>
        <button id="save-rating-button" class="custom-button">Save Rating</button>
      </div>
    </div>`;

    // Event listener for rating stars
    starElements = document.querySelectorAll(".stars .fa-star");

    starElements.forEach(star => {
      star.addEventListener('click', function() {
        selectedRating = parseInt(star.getAttribute("data-rating"));
        updateStarDisplay();
      });
    });

    // Setting the character ID to the showContainer
    showContainer.setAttribute("data-character-id", characterID);

    // Add the bookmark button event listener
    const bookmarkButton = document.getElementById("bookmark-button");
    if (bookmarkButton) {
      bookmarkButton.addEventListener('click', function() {
      console.log("Bookmark button clicked!");
      const characterID = showContainer.getAttribute("data-character-id");
      if (!characterID) {
        console.error("No character ID found for bookmarking");
      return;
    }
    console.log("Sending bookmark for characterID:", characterID, "and userID:", userID);
    // Send a request to the server to save the bookmark
    fetch('/addBookmark', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            characterID: characterID,
            userID: userID
        })
      })
      .then(response => response.json())
      .then(data => {
          if (data.message) {
              console.log(data.message);
          } else {
              console.error("Error bookmarking character");
          }
      })
      .catch(error => {
          console.error("Error:", error);
      });
  });
}

// Fetch and display the ratings
fetchAndDisplayUserRating(characterID);
fetchAndDisplayAverageRating(characterID);



// ----------- Rating Functionality -------------
// Fetch the current user ID as soon as the script loads
let userID;
fetch('/getCurrentUserID')
.then(response => response.json())
.then(data => {
  if (data.userID) {
    userID = data.userID;
    fetchAndDisplayUserRating(characterID);
  } else {
    throw new Error(data.error || 'Error fetching userID');
  }
})
.catch(error => {
  console.error("Error:", error);
});

// Update the star display based on the selected rating
function updateStarDisplay() {
  starElements.forEach((s, index) => {
    if (index < selectedRating) {
      s.classList.remove("far");
      s.classList.add("fas");
    } else {
      s.classList.remove("fas");
      s.classList.add("far");
    }
  });
}

const saveRatingButton = document.getElementById("save-rating-button");
saveRatingButton.addEventListener('click', function() {
console.log("Save Rating button clicked");
const characterID = showContainer.getAttribute("data-character-id");
console.log("Character ID:", characterID);
if (!characterID) {
  console.error("No character ID found");
  return;
}
  
// Send a request to the server to save the rating
fetch('/submitRating', {
method: 'POST',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({
  characterID: characterID,
  rating: selectedRating,
  userID: userID
})
})
.then(response => response.json())
.then(data => {
  if (data.message) {
    console.log(data.message);
    fetchAndDisplayAverageRating(characterID);
  } else {
    console.error("Error submitting rating");
  }
  })
  .catch(error => {
  console.error("Error:", error);
  });
});

// Fetch and display the average rating
function fetchAndDisplayAverageRating(characterID) {
fetch(`/getRating/${characterID}`)
.then(response => response.json())
.then(data => {
  const avgRatingElement = document.getElementById("average-rating");
  if (typeof data.averageRating === 'number' || typeof data.averageRating === 'string') {
    avgRatingElement.textContent = parseFloat(data.averageRating).toFixed(2);
  } else {
    avgRatingElement.textContent = "No ratings available";
  }
})
.catch(error => {
  console.error("Error fetching average rating:", error);
});
}

// Fetch and display the user's rating
function fetchAndDisplayUserRating(characterID) {
console.log("Fetching rating for characterID:", characterID);
if (!characterID) {
    console.log("Character ID not available yet.");
    return;
}

// Send a request to the server to get the user's rating
fetch(`/getUserRating/${characterID}`)
.then(response => response.json())
.then(data => {
  if (data.rating) {
    selectedRating = data.rating;
    updateStarDisplay();
  }
})
.catch(error => {
  console.error("Error fetching user rating:", error);
});
}
});    

// Fetch and display comments after fetching character details
const commentsResponse = await fetch(`/comments/${characterID}`);
const comments = await commentsResponse.json();

const commentListContainer = document.querySelector('.comment-list');
commentListContainer.innerHTML = ''; // Clear any existing comments

if (Array.isArray(comments)) {
  comments.forEach(comment => {

      // Display each comment with username, icon, timestamp, and content
      const commentDiv = document.createElement('div');
      commentDiv.classList.add('comment');
      commentDiv.innerHTML = `
      <div class="comment-header">
          <img class="comment-icon" src="/assets/images/icons/${comment.icon}" alt="${comment.username}'s icon">
          <span class="comment-username">${comment.username}</span>
          <span class="comment-date">${new Date(comment.datePosted).toLocaleString()}</span>
      </div>
      <div class="comment-content">
          <p>${comment.commentContent}</p>
      </div>
      <div class="comment-footer">
          <button class="upvote-btn" data-comment-id="${comment.commentID}"><i class="fas fa-thumbs-up"></i> (${comment.upvotes})</button>
          ${comment.userID == loggedInUserId ? `<button class="edit-btn" data-comment-id="${comment.commentID}"><i class="fas fa-pencil-alt"></i></button>` : ''}
          ${comment.userID == loggedInUserId ? `<button class="delete-btn" data-comment-id="${comment.commentID}"><i class="fas fa-trash"></i></button>` : ''}
      </div>
      `;

      commentListContainer.appendChild(commentDiv);
  });
} else {
  console.error("Received unexpected data:", comments);
}
}


// Event listener for fetching and displaying character details, ratings, and comments upon button click
button.addEventListener("click", getRsult);

// ----------- Comment Functionality -------------
// Event listener for posting comments
document.getElementById('post-comment-button').addEventListener('click', async () => {
const commentText = document.getElementById('comment-text').value;
if (!commentText) return alert('Comment cannot be empty!');
const response = await fetch('/comments', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      characterID: characterID,
      commentContent: commentText
    })
});

const data = await response.json();
if (data.success) {
    // Clear the comment input
    document.getElementById('comment-text').value = "";

    // Re-fetch comments to update the display
    getRsult();
} else {
    alert('Error posting comment. Please try again.');
}
});

// Event listener for upvoting comments
document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('upvote-btn')) {
      const commentId = event.target.getAttribute('data-comment-id');
      
      const response = await fetch(`/comments/upvote/${commentId}`, {
          method: 'PUT'
      });

      const data = await response.json();
      if (data.success) {
          // Update upvote count displayed on the button
          const currentUpvotes = parseInt(event.target.textContent.match(/\d+/)[0], 10);
          event.target.textContent = `Upvote (${currentUpvotes + 1})`;
      } else {
          alert('Error upvoting comment. Please try again.');
      }
  }
});

// Event listener for editing comments
document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('edit-btn')) {
      const commentId = event.target.getAttribute('data-comment-id');
      const commentDiv = event.target.closest('.comment');
      originalCommentContent = commentDiv.innerHTML;  // Store the original content
      const originalText = commentDiv.querySelector('p').textContent;

      // Show an edit form in place of the original comment content
      commentDiv.innerHTML = `
          <textarea class="edit-comment-text">${originalText}</textarea>
          <button class="save-edit-btn" data-comment-id="${commentId}">Save</button>
          <button class="cancel-edit-btn">Cancel</button>
      `;
  }
});

// Event listener for saving the edited comment
document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('save-edit-btn')) {
      const commentId = event.target.getAttribute('data-comment-id');
      const commentDiv = event.target.closest('.comment');
      const newContent = commentDiv.querySelector('.edit-comment-text').value;

      const response = await fetch(`/comments/${commentId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              content: newContent
          })
      });

      const data = await response.json();
      if (data.success) {
          // Restore the original comment structure (before editing)
          commentDiv.innerHTML = originalCommentContent;
          // Update the comment content with the new content
          commentDiv.querySelector('p').textContent = newContent;
      } else {
          alert('Error editing comment. Please try again.');
      }
  }
});
// Event listener for cancelling the comment edit
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('cancel-edit-btn')) {
      const commentDiv = event.target.closest('.comment');
      // Restore the original comment content (before editing)
      commentDiv.innerHTML = originalCommentContent;
  }
});

// Event listener for deleting comments
document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('delete-btn')) {
      const commentId = event.target.getAttribute('data-comment-id');
      const confirmation = confirm('Are you sure you want to delete this comment?');

      if (confirmation) {
          const response = await fetch(`/comments/${commentId}`, {
              method: 'DELETE'
          });

          const data = await response.json();
          if (data.success) {
              // Remove the comment from the DOM
              event.target.closest('.comment').remove();
          } else {
              alert('Error deleting comment. Please try again.');
          }
      }
  }
});



// ----------- Rating Functionality -------------
// Fetch the current user ID as soon as the script loads
let userID;
fetch('/getCurrentUserID')
.then(response => response.json())
.then(data => {
  if (data.userID) {
    userID = data.userID;
    fetchAndDisplayUserRating(characterID);
  } else {
    throw new Error(data.error || 'Error fetching userID');
  }
})
.catch(error => {
  console.error("Error:", error);
});



// Update the star display based on the selected rating
function updateStarDisplay() {
  starElements.forEach((s, index) => {
  if (index < selectedRating) {
    s.classList.remove("far");
    s.classList.add("fas");
  } else {
    s.classList.remove("fas");
    s.classList.add("far");
  }
  });
}

// Fetch and display the average rating
function fetchAndDisplayAverageRating(characterID) {
fetch(`/getRating/${characterID}`)
.then(response => response.json())
.then(data => {
  const avgRatingElement = document.getElementById("average-rating");
  if (typeof data.averageRating === 'number' || typeof data.averageRating === 'string') {
    avgRatingElement.textContent = parseFloat(data.averageRating).toFixed(2);
  } else {
    avgRatingElement.textContent = "No ratings available";
  }
})
.catch(error => {
  console.error("Error fetching average rating:", error);
});
}

// Fetch and display the user's rating
function fetchAndDisplayUserRating(characterID) {
console.log("Fetching rating for characterID:", characterID);
if (!characterID) {
    console.log("Character ID not available yet.");
    return;
}

// Send a request to the server to get the user's rating
fetch(`/getUserRating/${characterID}`)
.then(response => response.json())
.then(data => {
  if (data.rating) {
    selectedRating = data.rating;
    updateStarDisplay();
  }
})
.catch(error => {
  console.error("Error fetching user rating:", error);
});
}


const bookmarkButton = document.createElement('button');
bookmarkButton.id = "bookmark-button";
bookmarkButton.textContent = "Bookmark";
bookmarkButton.classList.add('custom-button');