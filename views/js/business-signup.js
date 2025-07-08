// Show message function
function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Business registration
document.getElementById('businessRegisterForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const businessData = {
        salon_name: formData.get('salon_name'),
        salon_address: formData.get('salon_address'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('/api/businesses/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(businessData)
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(data.message, 'success');
            setTimeout(() => {
                window.location.href = '/business-login';
            }, 2000);
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
    }
}); 