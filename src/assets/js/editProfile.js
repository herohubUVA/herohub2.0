document.addEventListener('DOMContentLoaded', () => {
    // Fetch available icons and populate the dropdown
    fetch('/fetch-icons')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(files => {
            const iconDropdown = document.querySelector('#profile-picture-select');
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file.split('.')[0];  // Display name without file extension
                iconDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching icons:', error));

    // Update display icon when dropdown selection changes
    const iconDropdown = document.querySelector('#profile-picture-select');
    iconDropdown.addEventListener('change', function() {
        document.getElementById('current-icon').src = `/assets/images/icons/${this.value}`;
    });

    // Handle update icon request
    const updateIconBtn = document.querySelector('#update-profile-pic');
    updateIconBtn.addEventListener('click', function() {
        fetch('/updateIcon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon: iconDropdown.value }),
            credentials: 'same-origin'  // Ensure cookies are sent with the request
        }).then(response => response.json())
          .then(data => {
              if(data.success) {
                  alert("Icon changed successfully!");

                  document.getElementById('current-icon').src = `/assets/images/icons/${iconDropdown.value}`;
              } else {
                  alert(data.message);
              }
          });
    });

    // Change Username
    const updateUsernameBtn = document.querySelector('#update-username');
    const usernameInput = document.querySelector('#new-username');
    updateUsernameBtn.addEventListener('click', function() {
        fetch('/updateUsername', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newUsername: usernameInput.value })
        }).then(response => response.json())
          .then(data => {
              if(data.success) {
                  alert("Username updated successfully!");
                  
              } else {
                  alert(data.message);
              }
          });
    });

    // Change Password
    const updatePasswordBtn = document.querySelector('#update-password');
    const currentPasswordInput = document.querySelector('#current-password');
    const newPasswordInput = document.querySelector('#new-password');
    updatePasswordBtn.addEventListener('click', function() {
        fetch('/updatePassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                currentPassword: currentPasswordInput.value,
                newPassword: newPasswordInput.value 
            })
        }).then(response => response.json())
          .then(data => {
              if(data.success) {
                  alert("Password updated successfully!");
              } else {
                  alert(data.message);
              }
          });
    });

    // Delete Account
    const deleteAccountBtn = document.querySelector('#delete-account');
    deleteAccountBtn.addEventListener('click', function() {
        const confirmation = confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (confirmation) {
            fetch('/deleteAccount', {
                method: 'POST',
            }).then(response => response.json())
              .then(data => {
                  if(data.success) {
                      alert("Account deleted successfully!");
                      window.location.href = '/'; // Redirect to the home or login page
                  } else {
                      alert(data.message);
                  }
              });
        }
    });
});
