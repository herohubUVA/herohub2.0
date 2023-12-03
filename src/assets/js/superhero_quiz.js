document.addEventListener("DOMContentLoaded", function() {
    console.log('Superhero Quizzes Page loaded successfully');
    const form = document.getElementById('quiz-form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Collect user answers
        const formData = new FormData(form);
        const answers = {};

        formData.forEach((value, key) => {
            answers[key] = value;
        });
        
        console.log(answers);
          // Create a key by concatenating all answer values
        const answerKey = Object.values(answers).join('-');

        // Define a mapping of answerKey to results
        const resultMapping = {
            'driving-shield-justice-martialarts-responsible': 'Captain America',
            'flying-bow-adventure-tech-intellect': 'Iron Man',
            'running-none-love-smash-power': 'Hulk',
            'teleportation-magicstaff-love-magic-power': 'Scarlett Witch',
            'running-none-justice-martialarts-responsible': 'Spiderman',
            'driving-bow-justice-martialarts-intellect': 'Black Widow',
            'flying-shield-adventure-smash-power': 'Thor',
            // Add more combinations as needed
        };

        // Get the result based on the answerKey, or default to 'Shield Agent'
        const result = resultMapping[answerKey] || 'Shield Agent';
        
        const resultStyles = {
            'Captain America': 'captain-america-style',
            'Iron Man': 'iron-man-style',
            'Hulk': 'hulk-style',
            'Scarlett Witch': 'witch-style',
            'Spiderman': 'spider-style',
            'Black Widow': 'widow-style',
            'Thor': 'thor-style',
            
          };
        
      
        const heroStyleClass = resultStyles[result] || 'shield-style';

        console.log('Answer Key:', answerKey);
        console.log('Result:', result);
        // Now you can use the 'result' variable as needed
        // console.log('Grooop');
        // res.redirect(`/result?hero=${encodeURIComponent(result)}`); 
        window.location.href = `/result_superhero?hero=${result}&style=${heroStyleClass}`;
      

        // Send answers to the server for processing
        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers }), // Send answers directly without wrapping
        })
        // .then(response => response.json())
        .then(data => {
            // Display the result on the page
            console.log('WHOOP WHOOP');
            const resultContainer = document.getElementById('result');
            resultContainer.textContent = `You are: ${data.result}`; 
           
        })
        .catch(error => console.error('Error:', error));
    });
});
