// Declare variables
var toggle_btn;
var big_wrapper;
var hamburger_menu;
const main = document.querySelector("main");
let playButton;
const audio = new Audio('/assets/audio/marvelOpening.mp3');
let volumeBars;
let dark = false;

// Init variables to DOM elements
function declare() {
    toggle_btn = document.querySelector(".toggle-btn");
    big_wrapper = document.querySelector(".big-wrapper");
    hamburger_menu = document.querySelector(".hamburger-menu");
    playButton = document.querySelector('.play-button');
    volumeBars = document.querySelectorAll('.volume-bar');
}

declare();

// Toggle theme and animation for light and dark theme
function toggleAnimation() {
    if (!audio.paused) {
        pauseAudio();
    }

    // Change audio source based on theme
    if (dark) {
        audio.src = '/assets/audio/marvelOpening.mp3';
    } else {
        audio.src = '/assets/audio/endgameAudio.mp3';
    }

    // Clone the wrapper for theme animation
    dark = !dark;
    let clone = big_wrapper.cloneNode(true);
    if (dark) {
        clone.classList.remove("light");
        clone.classList.add("dark");
    } else {
        clone.classList.remove("dark");
        clone.classList.add("light");
    }
    clone.classList.add("copy");
    main.appendChild(clone);
    document.body.classList.add("stop-scrolling");

    clone.addEventListener("animationend", () => {
        document.body.classList.remove("stop-scrolling");
        big_wrapper.remove();
        clone.classList.remove("copy");
        declare();
        bindEvents();
    });
}

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

/**
 * Binds event listeners to various elements.
 */
function bindEvents() {
    // Toggles between dark and light mode
    toggle_btn.addEventListener("click", toggleAnimation);

    // Toggles the navigation menu for smaller screens
    hamburger_menu.addEventListener("click", () => {
        big_wrapper.classList.toggle("active");
    });

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
}

bindEvents();
