document.addEventListener('DOMContentLoaded', (event) => {
    const ctxRatings = document.getElementById('ratingsChart').getContext('2d');
    const ctxCommented = document.getElementById('mostCommentedChart').getContext('2d');
    const ctxBookmarked = document.getElementById('mostBookmarkedChart').getContext('2d');
    const ctxRatingsOverTime = document.getElementById('ratingsOverTimeChart').getContext('2d');

    // Function to create a bar chart
    function createBarChart(ctx, labels, data, label) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
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
    }


    // Function to create a line chart
function createLineChart(ctx, labels, data, label) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
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
}


    // Fetch and create chart for highest and lowest-rated characters
    fetch('/api/highest-lowest-rated-characters')
        .then(response => response.json())
        .then(data => {
            const labels = [data.highestRated[0].characterName, data.lowestRated[0].characterName];
            const ratings = [data.highestRated[0].averageRating, data.lowestRated[0].averageRating];
            createBarChart(ctxRatings, labels, ratings, 'Character Ratings');
        })
        .catch(error => console.error('Error fetching rating data:', error));

    // Fetch and create chart for most searched characters
    fetch('/api/most-searched-characters')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(character => character.characterName);
            const searches = data.map(character => character.searchCount);
            createBarChart(ctxSearched, labels, searches, 'Search Counts');
        })
        .catch(error => console.error('Error fetching search data:', error));

        
        // Fetch and create chart for most commented characters
    fetch('/api/most-commented-characters')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(character => character.characterName);
        const comments = data.map(character => character.commentCount);
        createBarChart(ctxCommented, labels, comments, 'Comment Counts');
    })
    .catch(error => console.error('Error fetching commented data:', error));

    // Fetch and create chart for most bookmarked characters
    fetch('/api/most-bookmarked-characters')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(character => character.characterName);
        const bookmarks = data.map(character => character.bookmarkCount);
        createBarChart(ctxBookmarked, labels, bookmarks, 'Bookmark Counts');
    })
    .catch(error => console.error('Error fetching bookmarked data:', error));

    // Fetch and create line chart for ratings over time (example for characterID 1)
    fetch('/api/ratings-over-time/1')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(entry => entry.date);
        const ratings = data.map(entry => entry.averageRating);
        createLineChart(ctxRatingsOverTime, labels, ratings, 'Average Ratings Over Time');
    })
    .catch(error => console.error('Error fetching ratings over time:', error));

});
