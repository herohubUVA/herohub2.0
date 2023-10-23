document.getElementById('supportForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const formData = new URLSearchParams(new FormData(this)).toString();
    const response = await fetch(this.action, {
      method: this.method,
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });
  
    if (response.ok) {
      alert('Support request submitted successfully');
    } else {
      alert('Failed to submit support request');
    }
  });
  