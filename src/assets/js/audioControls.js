// Audio Controls Variables
const main = document.querySelector("main");
let playButton;
const audio = new Audio('/assets/audio/marvelOpening.mp3');
let volumeBars;
let wasPlayingBeforeThemeChange = false;


// Init variables to DOM elements related to audio controls
function declareAudioElements() {
    playButton = document.querySelector('.play-button');
    volumeBars = document.querySelectorAll('.volume-bar');
}

declareAudioElements();

/**
 * Plays the audio and updates the play button to reflect status (pause->play)
 */
function playAudio() {
    audio.play().then(() => {
        playButton.src = '/assets/images/pause.png';
    });
}

/**
 * Pauses the audio and updates the play button (play->pause)
 */
function pauseAudio() {
    audio.pause();
    playButton.src = '/assets/images/play.png';
}

document.addEventListener('themeChangedToDark', function() {
    pauseAudio();
    audio.src = '/assets/audio/endgameAudio.mp3';
    if (wasPlayingBeforeThemeChange) playAudio();
});

document.addEventListener('themeChangedToLight', function() {
    pauseAudio();
    audio.src = '/assets/audio/marvelOpening.mp3';
    if (wasPlayingBeforeThemeChange) playAudio();
});

// Binds audio-related event listeners
function bindAudioEvents() {
    // Play or pause audio based on its current state
    playButton.addEventListener('click', function() {
        if (audio.paused) {
            playAudio();
        } else {
            pauseAudio();
        }
    });

    // Volume control functionality
    volumeBars.forEach((bar, index) => {
        bar.addEventListener('click', function() {
            const level = parseInt(this.getAttribute('data-level'));
            audio.volume = level / (volumeBars.length - 1);

            volumeBars.forEach((innerBar, innerIndex) => {
                if (innerIndex <= index) {
                    innerBar.classList.add('active');
                } else {
                    innerBar.classList.remove('active');
                }
            });
        });
    });
    bindVolumeControls();
}

function bindVolumeControls() {
    volumeBars.forEach((bar, index) => {
        if (bar.boundClickHandler) {
            bar.removeEventListener('click', bar.boundClickHandler);
        }
        bar.boundClickHandler = volumeBarClickHandler.bind(null, index);
        bar.addEventListener('click', bar.boundClickHandler);
    });
}



function volumeBarClickHandler(index, event) {
    const bar = event.currentTarget;
    const level = parseInt(bar.getAttribute('data-level'));
    audio.volume = level / (volumeBars.length - 1);
    volumeBars.forEach((innerBar, innerIndex) => {
        if (innerIndex <= index) {
            innerBar.classList.add('active');
        } else {
            innerBar.classList.remove('active');
        }
    });
}

bindAudioEvents();
