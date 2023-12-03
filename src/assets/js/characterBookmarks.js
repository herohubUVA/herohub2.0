function showRemovedBookmarkPopup() {
    var popup = document.createElement('div');
    popup.className = 'removed-bookmark-popup';
    
    // Create a span element for the close button
    var closeButton = document.createElement('span');
    closeButton.textContent = '×'; // Unicode character for 'X'
    closeButton.className = 'close-button';
    
    // Style for the close button
    closeButton.style.float = 'right';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';

    // Append the close button to the popup
    popup.appendChild(closeButton);

    // Add the main text of the popup
    var text = document.createElement('span');
    text.textContent = 'Bookmark removed!';
    popup.appendChild(text);

    // Append the popup to the body
    document.body.appendChild(popup);
    popup.style.display = 'block';

    // Event listener to close the popup when the close button is clicked
    closeButton.addEventListener('click', function() {
        popup.style.display = 'none';
        document.body.removeChild(popup);
    });
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
                      location.reload();
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
