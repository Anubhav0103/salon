// Show message function
function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}
// User registration
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(data.message, 'success');
            setTimeout(() => {
                window.location.href = '/user-login';
            }, 2000);
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
    }
}); 