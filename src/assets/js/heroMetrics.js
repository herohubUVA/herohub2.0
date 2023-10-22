document.addEventListener('DOMContentLoaded', (event) => {
    const ctxRatings = document.getElementById('ratingsChart').getContext('2d');
    const ctxSearched = document.getElementById('mostSearchedChart').getContext('2d');
    const ctxCommented = document.getElementById('mostCommentedChart').getContext('2d');

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
        .catch(error => console.error('Error fetching comment data:', error));
});
