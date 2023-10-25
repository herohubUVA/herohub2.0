document.addEventListener('DOMContentLoaded', (event) => {
    const topRatedCharactersCtx = document.getElementById('topRatedCharactersChart').getContext('2d');
    const userActivityCtx = document.getElementById('userActivityChart').getContext('2d');
    const userUpvotesCtx = document.getElementById('userUpvotesChart').getContext('2d');
    const highestLowestRatedCharactersCtx = document.getElementById('highestLowestRatedCharactersChart').getContext('2d');

  
      // Fetch and render Highest and Lowest Rated Characters by the User
    fetch(`/api/user-highest-lowest-rated-characters/${userID}`)
    .then(response => response.json())
    .then(data => {
        const highestRatedCharacter = data.highestRated[0];
        const lowestRatedCharacter = data.lowestRated[0];
    
        new Chart(highestLowestRatedCharactersCtx, {
        type: 'bar',
        data: {
            labels: [highestRatedCharacter.characterName, lowestRatedCharacter.characterName],
            datasets: [
            {
                label: 'Highest Rated',
                data: [highestRatedCharacter.averageRating, null],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Lowest Rated',
                data: [null, lowestRatedCharacter.averageRating],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
            ]
        },
        options: {
            scales: {
            y: {
                beginAtZero: true,
                max: 5
            }
            }
        }
        });
    });

    // Fetch and render Top Rated Characters by the User
    fetch(`/api/user-top-rated-characters/${userID}`)
    .then(response => response.json())
    .then(data => {
        const labels = data.map(item => item.characterName);
        const values = data.map(item => item.averageRating);
  
        new Chart(topRatedCharactersCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Average Rating',
              data: values,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
    });
  
    // Fetch and render User Upvotes Over Time
    fetch(`/api/user-upvotes-over-time/${userID}`)
    .then(response => response.json())
    .then(data => {
        const labels = data.map(item => item.month);
        const values = data.map(item => item.count);

        new Chart(userUpvotesCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
            label: 'Upvotes',
            data: values,
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false,
            }]
        },
        options: {
            scales: {
            y: {
                beginAtZero: true
            }
            }
        }
        });
    });



    // Fetch and render User Activity Over Time
    fetch(`/api/user-activity-over-time/${userID}`)
    .then(response => response.json())
    .then(data => {
        const dates = Array.from(new Set([...data.reviews.map(r => r.month), ...data.comments.map(c => c.month), ...data.bookmarks.map(b => b.month)])).sort();
        const reviewData = createActivityData(data.reviews, dates);
        const commentData = createActivityData(data.comments, dates);
        const bookmarkData = createActivityData(data.bookmarks, dates);

        new Chart(userActivityCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
            {
                label: 'Reviews',
                data: reviewData,
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false,
            },
            {
                label: 'Comments',
                data: commentData,
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: false,
            },
            {
                label: 'Bookmarks',
                data: bookmarkData,
                borderColor: 'rgba(255, 206, 86, 1)',
                fill: false,
            },
            ]
        },
        options: {
            scales: {
            y: {
                beginAtZero: true
            }
            }
        }
        });
    });

});

function createActivityData(activityData, dates) {
    const activityMap = new Map(activityData.map(item => [item.month, item.count]));
    return dates.map(date => activityMap.get(date) || 0);
}
    
  