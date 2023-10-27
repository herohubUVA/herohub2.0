function initializeProfileDropdown() {
    const btn = document.querySelector(".profile-dropdown-btn");
    const profileDropDownList = document.querySelector(".profile-dropdown-list");

    if (btn) {
        btn.addEventListener('click', () => {
            if (profileDropDownList) {
                profileDropDownList.classList.toggle("active");
            }
        });
    }

    window.addEventListener('click', function(e) {
        if (profileDropDownList && btn && (btn !== e.target && !btn.contains(e.target))) {
            profileDropDownList.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeProfileDropdown);


const toggle = () => profileDropDownList.classList.toggle("active");

window.addEventListener('click', function(e) {
    if(!btn.contains(e.target))profileDropDownList.classList.remove('active');
});