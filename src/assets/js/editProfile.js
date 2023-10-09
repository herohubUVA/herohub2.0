document.addEventListener('DOMContentLoaded', () => {
    
    // Change Icon
    const iconDropdown = document.querySelector('#profile-picture-select');
    iconDropdown.addEventListener('change', function() {
        fetch('/updateIcon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon: this.value })
        }).then(response => response.json())
          .then(data => {
              if(data.success) {
                  alert("Icon changed successfully!");
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
