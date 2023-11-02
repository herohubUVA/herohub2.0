document.addEventListener("DOMContentLoaded", function() {
  const showContainer = document.querySelector(".bookmarks-container");
  console.log('Character Bookmark Page loaded successfully');
  console.log(showContainer);

  if (showContainer) {
      showContainer.addEventListener('click', function(event) {
          if (event.target.classList.contains('remove-bookmark-button')) {
              console.log("Remove bookmark button clicked!");
        
              // Fetch the closest bookmark container to the clicked button
              const bookmarkElement = event.target.closest('.bookmark');
              
              // Get the character ID from this bookmark element
              const characterID = bookmarkElement.getAttribute("data-character-id");
              const characterName = bookmarkElement.getAttribute("data-character-name");

              if (!characterName){
                console.error("No character name found for removing bookmark" + characterID);
              }

              if (!characterID) {
                  console.error("No character ID found for removing bookmark");
                  return;
              }
              
              // Send a request to your server to remove the bookmark
              fetch('/removeBookmark', {
                  method: 'DELETE',
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

                      // Remove the bookmark element from the DOM
                      bookmarkElement.remove();
                  } else {
                      console.error("Error removing bookmark");
                  }
              })
              .catch(error => {
                  console.error("Error:", error);
              });
          }
      });
  }
});