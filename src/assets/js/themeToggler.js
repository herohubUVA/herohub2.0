// Theme Toggler Variables
var toggle_btn;
var big_wrapper;
var hamburger_menu;
var dark = false;

// Init variables to DOM elements related to theme toggling
function declareThemeElements() {
    toggle_btn = document.querySelector(".toggle-btn");
    big_wrapper = document.querySelector(".big-wrapper");
    hamburger_menu = document.querySelector(".hamburger-menu");
}

declareThemeElements();

// Toggle theme and animation for light and dark theme
function toggleAnimation() {
    let event;
    
    if (dark) {
        event = new Event('themeChangedToLight');
    } else {
        event = new Event('themeChangedToDark');
    }
    document.dispatchEvent(event);

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
    document.body.appendChild(clone);
    document.body.classList.add("stop-scrolling");

    clone.addEventListener("animationend", () => {
        document.body.classList.remove("stop-scrolling");
        big_wrapper.remove();
        clone.classList.remove("copy");
        declareThemeElements();
        bindThemeEvents();
        declareAudioElements();
        bindAudioEvents();
        initializeProfileDropdown();
        if (typeof initializeAnalyticCharts === "function") {
            initializeAnalyticCharts();
        }
        if (typeof initializeHeroCharts === "function") {
            initializeHeroCharts();
        }
    });
    
}


// Binds theme-related event listeners
function bindThemeEvents() {
    // Toggles between dark and light mode
    toggle_btn.addEventListener("click", toggleAnimation);

    // Toggles the navigation menu for smaller screens
    hamburger_menu.addEventListener("click", () => {
        big_wrapper.classList.toggle("active");
    });
}

bindThemeEvents();
