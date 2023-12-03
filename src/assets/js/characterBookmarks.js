function showRemovedBookmarkPopup() {
    var popup = document.createElement('div');
    popup.className = 'removed-bookmark-popup';
    popup.textContent = 'Bookmark removed!';
    document.body.appendChild(popup);
    popup.style.display = 'block';

    // Hide the popup after a few seconds
    setTimeout(function() {
        popup.style.dishowRemovedBookmarkPopup();
              splay = 'none';
        document.body.removeChild(popup);
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function() {
  const showContainer = document.querySelector(".bookmarks-container");
  console.log('Character Bookmark Page loaded successfully');
  console.log(showContainer);

  
  if (showContainer) {
      showContainer.addEventListener('click', function(event) {
          if (event.target.classList.contains('remove-bookmark-button')) {
              console.log("Remove bookmark button clicked!");
              showRemovedBookmarkPopup();
              // Fetch the closest bookmark container to the clicked button
              const bookmarkElement = event.target.closest('.bookmark');
              
              // Get the character ID from this bookmark element
              const characterID = bookmarkElement.getAttribute("data-character-id");

              if (!characterID) {
                  console.error("No character ID found for removing bookmark");
                  return;
              }
            //   fetch('/getCharacterInfo?characterID=${characterID}', {
            //     method: 'GET', 
            //     headers: {
            //         'Content Type': 'application/json'
            //     }
            //   })

            let userID = 25; // Replace with the actual userID
            // let characterID; // Replace with the actual characterID


            fetch(`/user/${userID}/bookmarks`)
            .then((response) => {
                if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                // Handle the bookmark information returned from the server
                console.log(data);
                // You can process the data and display it on your web page
            })
            .catch((error) => {
                console.error(`Fetch error: ${error.message}`);
                // Handle the error gracefully, e.g., display an error message on your web page
            });
              
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
