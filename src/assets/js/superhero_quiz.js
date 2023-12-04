document.getElementById('quiz-form').addEventListener('submit', async function (e) {
    console.log('Superhero Quizzes Page loaded successfully');
    const form = document.getElementById('quiz-form');
    e.preventDefault();
    
  // }
        // Collect user answers
        const formData = new FormData(form);
        const answers = {};
      

        formData.forEach((value, key) => {
            answers[key] = value;
        });
        
        console.log(answers);
          // Create a key by concatenating all answer values
        const answerKey = Object.values(answers).join('-');
        console.log("what up");
        // Define a mapping of answerKey to results
        const resultMapping = {
          'driving-shield-justice-martialarts-responsible': 'Captain America',
          'flying-bow-adventure-tech-intellect': 'Iron Man',
          'running-none-love-smash-power': 'Hulk',
          'teleportation-magicstaff-love-magic-power': 'Scarlett Witch',
          'running-none-justice-martialarts-responsible': 'Spiderman',
          'driving-bow-justice-martialarts-intellect': 'Black Widow',
          'flying-shield-adventure-smash-power': 'Thor',
          'running-shield-justice-tech-power': 'Captain America',
          'flying-none-adventure-martialarts-intellect': 'Iron Man',
          'driving-bow-love-smash-responsible': 'Hulk',
          'teleportation-none-justice-magic-intellect': 'Scarlett Witch',
          'running-bow-adventure-martialarts-power': 'Spiderman',
          'driving-magicstaff-justice-tech-responsible': 'Black Widow',
          'flying-none-love-smash-intellect': 'Thor',
          'running-shield-love-tech-responsible': 'Captain America',
          'driving-bow-justice-smash-power': 'Iron Man',
          'flying-magicstaff-adventure-magic-responsible': 'Scarlett Witch',
          'teleportation-shield-justice-smash-intellect': 'Hulk',
          'running-none-love-martialarts-power': 'Spiderman',
          'driving-none-adventure-tech-responsible': 'Black Widow',
          'flying-bow-justice-martialarts-intellect': 'Thor',
          'teleportation-shield-love-martialarts-power': 'Captain America',
          'running-bow-justice-tech-responsible': 'Iron Man',
          'driving-none-adventure-magic-power': 'Scarlett Witch',
          'flying-shield-love-smash-intellect': 'Hulk',
          'teleportation-bow-justice-martialarts-responsible': 'Spiderman',
          'running-magicstaff-adventure-tech-power': 'Black Widow',
          'driving-shield-love-martialarts-intellect': 'Thor',
          'flying-none-justice-smash-responsible': 'Captain America',
          'teleportation-bow-love-tech-intellect': 'Iron Man',
          'running-shield-justice-tech-responsible': 'Captain America',
          'flying-none-adventure-martialarts-power': 'Iron Man',
          'driving-bow-love-smash-intellect': 'Hulk',
          'teleportation-none-justice-magic-power': 'Scarlett Witch',
          'running-bow-adventure-martialarts-intellect': 'Spiderman',
          'driving-magicstaff-justice-tech-power': 'Black Widow',
          'flying-none-love-smash-responsible': 'Thor',
          'running-shield-love-tech-intellect': 'Captain America',
          'driving-bow-justice-smash-intellect': 'Iron Man',
          'flying-magicstaff-adventure-magic-power': 'Scarlett Witch',
          'teleportation-shield-justice-smash-power': 'Hulk',
          'running-none-love-martialarts-intellect': 'Spiderman',
          'driving-none-adventure-tech-power': 'Black Widow',
          'flying-bow-justice-martialarts-power': 'Thor',
          'teleportation-shield-love-martialarts-intellect': 'Captain America',
          'running-bow-justice-tech-power': 'Iron Man',
          'driving-none-adventure-magic-intellect': 'Scarlett Witch',
          'flying-shield-love-smash-power': 'Hulk',
          'teleportation-bow-justice-martialarts-intellect': 'Spiderman',
          'running-magicstaff-adventure-tech-intellect': 'Black Widow',
          'driving-shield-love-martialarts-power': 'Thor',
          'flying-none-justice-smash-intellect': 'Captain America',
          'teleportation-bow-love-tech-power': 'Iron Man'
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
        // 
      

        // Send answers to the server for processing
        const response = await fetch(this.action, {
          method: this.method,
          body: JSON.stringify({ result }),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }, 
        });
        if (response.ok) {
          window.location.href = `/result_superhero?hero=${result}&style=${heroStyleClass}`;
      } else {
          // Handle errors here
          console.error('Error submitting form');
      }
         
       

    });


