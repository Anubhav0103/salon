// Show message function
function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}
// User login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const userData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(data.message, 'success');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                window.location.href = '/book';
            }, 2000);
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
    }
}); 