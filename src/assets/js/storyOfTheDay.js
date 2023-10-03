// The endpoint of your server where you've set up the caching and fetching logic
const serverEndpoint = "/getStoryOfTheDay";

const displayStory = (storyData) => {
    console.log(storyData);
    const showcaseArea = document.querySelector('.showcase-area .left');
    const title = storyData.title;
    const description = storyData.description || "No description available.";
    const storyContent = `
        <div class="big-title">
            <h1>${title}</h1>
        </div>
        <p class="text">
            ${description}
        </p>
    `;

    showcaseArea.innerHTML = storyContent;
};

const fetchStoryFromServer = async () => {
  try {
    const response = await fetch(serverEndpoint);
    
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const storyData = await response.json();

    if (storyData && storyData.title) {
      displayStory(storyData);
    } else {
      displayStory({
        title: "No story available",
        description: "There seems to be a problem retrieving the story. Please try again later."
      });
    }
  } catch (error) {
    console.error("Error fetching the story:", error);
    displayStory({
      title: "Error fetching story",
      description: "There was an error retrieving the story. Please try again later."
    });
  }
};

// Fetch and display the story of the day when the page loads
window.onload = () => {
    fetchStoryFromServer();
};
