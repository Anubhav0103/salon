// Show message function
function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}
// Business login
document.getElementById('businessLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    try {
        const response = await fetch('/api/businesses/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(data.message, 'success');
            const decoded = jwt_decode(data.token);
            localStorage.setItem('token', data.token);

            setTimeout(() => {
                window.location.href = '/business-staff';
            }, 2000);
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
    }
}); 