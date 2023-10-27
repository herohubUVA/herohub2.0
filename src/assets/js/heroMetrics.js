function initializeHeroCharts() {
    const ctxRatings = document.getElementById('ratingsChart').getContext('2d');
    const ctxCommented = document.getElementById('mostCommentedChart').getContext('2d');
    const ctxBookmarked = document.getElementById('mostBookmarkedChart').getContext('2d');
    const ctxRatingsOverTime = document.getElementById('ratingsOverTimeChart').getContext('2d');
    const chartContainer = document.getElementById('ratingsOverTimeChartContainer'); // Add a container for the chart

    // Function to create a bar chart
    function createBarChart(ctx, labels, data, label, backgroundColor, borderColor) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
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
    function createLineChart(ctx, labels, data, label, backgroundColor, borderColor) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    fill: true,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
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

    // Function to update the ratings over time chart
    function updateRatingsOverTimeChart(characterID, label, backgroundColor, borderColor) {
        console.log('Fetching ratings over time for character ID:', characterID);
        fetch(`/api/ratings-over-time/${characterID}`)
            .then(response => response.json())
            .then(data => {
                // Sample data to limit data points
                const sampledData = sampleData(data, 10); // Adjust the sample size as needed

                console.log('Ratings over time data:', sampledData);
                const labels = sampledData.map(entry => entry.date);
                const ratings = sampledData.map(entry => parseFloat(entry.averageRating)); // Ensure ratings are numbers
                ratingsOverTimeChart.data.labels = labels;
                ratingsOverTimeChart.data.datasets.push({
                    label: label,
                    data: ratings,
                    fill: true,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1
                });
                ratingsOverTimeChart.update();
            })
            .catch(error => console.error('Error fetching ratings over time data:', error));
    }

    // Function to sample data and limit data points
    function sampleData(data, sampleSize) {
        const step = Math.max(1, Math.floor(data.length / sampleSize));
        return data.filter((entry, index) => index % step === 0);
    }

    // Initialize an empty line chart for ratings over time
    const ratingsOverTimeChart = createLineChart(ctxRatingsOverTime, [], [], '', '', '');

    // Add a click event listener to the chart container
    chartContainer.addEventListener('click', () => {
        chartContainer.classList.toggle('full-screen');

        // Adjust the chart size on entering/exiting full-screen mode
        if (chartContainer.classList.contains('full-screen')) {
            // Enlarge the chart to cover the screen
            ratingsOverTimeChart.options.responsive = true; // Enable responsiveness
            ratingsOverTimeChart.canvas.style.width = '100%';
            ratingsOverTimeChart.canvas.style.height = '100%';
            ratingsOverTimeChart.resize(); // Trigger chart resize
        } else {
            // Restore the original chart size
            ratingsOverTimeChart.options.responsive = false; // Disable responsiveness
            ratingsOverTimeChart.canvas.style.width = ''; // Remove inline style
            ratingsOverTimeChart.canvas.style.height = ''; // Remove inline style
            ratingsOverTimeChart.resize(); // Trigger chart resize
        }
    });

    // Fetch and create chart for highest and lowest-rated characters
    fetch('/api/highest-lowest-rated-characters')
        .then(response => response.json())
        .then(data => {
            const highestRatedCharacter = data.highestRated[0];
            const lowestRatedCharacter = data.lowestRated[0];

            if (!highestRatedCharacter || !lowestRatedCharacter) {
                throw new Error('Missing data for highest or lowest rated character');
            }

            if (typeof highestRatedCharacter.characterID === 'undefined' || typeof lowestRatedCharacter.characterID === 'undefined') {
                throw new Error('Missing characterID for highest or lowest rated character');
            }

            const labels = [highestRatedCharacter.characterName, lowestRatedCharacter.characterName];
            const ratings = [highestRatedCharacter.averageRating, lowestRatedCharacter.averageRating];
            createBarChart(ctxRatings, labels, ratings, 'Character Ratings', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');

            // Update the ratings over time chart
            updateRatingsOverTimeChart(highestRatedCharacter.characterID.toString(), highestRatedCharacter.characterName + ' Ratings Over Time', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)');
            updateRatingsOverTimeChart(lowestRatedCharacter.characterID.toString(), lowestRatedCharacter.characterName + ' Ratings Over Time', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
        })
        .catch(error => console.error('Error fetching rating data:', error));

    // Fetch and create chart for most commented characters
    fetch('/api/most-commented-characters')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(character => character.characterName);
            const comments = data.map(character => character.commentCount);
            createBarChart(ctxCommented, labels, comments, 'Comment Counts', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 1)');
        })
        .catch(error => console.error('Error fetching commented data:', error));

    // Fetch and create chart for most bookmarked characters
    fetch('/api/most-bookmarked-characters')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(character => character.characterName);
            const bookmarks = data.map(character => character.bookmarkCount);
            createBarChart(ctxBookmarked, labels, bookmarks, 'Bookmark Counts', 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)');
        })
        .catch(error => console.error('Error fetching bookmark data:', error));
}

document.addEventListener('DOMContentLoaded', initializeHeroCharts);