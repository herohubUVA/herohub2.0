document.addEventListener("DOMContentLoaded", function() {
    console.log('Superhero Quizzes Page loaded successfully');

    const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Create a 'public' folder for your static files (e.g., stylesheets)

// Sample list of quiz results
const quizResults = {
    result1: 'You are a Flying Hero!',
    result2: 'You have Laser Vision!',
    // Add more results as needed
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/quiz.html');
});

app.post('/quiz', (req, res) => {
    const selectedPower = req.body.power; // Assuming your radio button has a 'name' attribute of 'power'

    // Add your logic to determine the result based on the selected power
    const result = determineQuizResult(selectedPower);

    res.send(`<h2>Your Quiz Result:</h2><p>${result}</p>`);
});

function determineQuizResult(selectedPower) {
    // Add your logic to determine the result based on the selected power
    // This is a simple example; customize it according to your needs
    switch (selectedPower) {
        case 'flight':
            return quizResults.result1;
        case 'laser':
            return quizResults.result2;
        // Add more cases as needed
        default:
            return 'No result determined';
    }
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

  });