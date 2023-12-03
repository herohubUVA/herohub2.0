console.log('In result javascript');
document.addEventListener("DOMContentLoaded", function() {
    console.log('Quizzes Page loaded successfully');
});

function getHeroImage(heroStyleClass) {
    const imageMappings = {
        'captain-america-style': '/images/captain_america_quiz.webp',
        'iron-man-style': '/images/Ironman_quiz.jpeg',
        'hulk-style': '/images/hulk_quiz.jpg',
        'widow-style': '/images/blackwidow_quiz.jpg',
        'witch-style': 'scarlett_witch.jpeg',
        'spider-style': 'Spiderman_quiz.jpeg',
        'thor-style': 'thor_quiz.jpg',
    };

    return imageMappings[heroStyleClass] || '/images/agent_shield.jpg';
}
