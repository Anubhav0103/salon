document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    let user = null;

    if (!token) {
        alert('Please log in to view your bookings.');
        window.location.href = '/user-login';
        return; // Stop execution
    }

    try {
        user = jwt_decode(token);
        if (user.role !== 'user') throw new Error("Not a user");
    } catch (e) {
        alert('Your session is invalid. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/user-login';
        return; // Stop execution
    }
    // --- End Authentication Check ---

    // --- Event Listeners ---
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent the link from navigating immediately
            localStorage.removeItem('token');
            window.location.href = '/user-login';
        });
    }

    // --- Core Function ---
    function fetchUserBookings() {
        // This fetch call is now secure and uses the user_id from the token
        fetch(`/api/users/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err.error));
            return res.json();
        })
        .then(data => {
            const tbody = document.getElementById('userBookingsBody');
            tbody.innerHTML = '';
            
            if (!data.bookings || data.bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">You have no past or upcoming bookings.</td></tr>';
                return;
            }

            // Sort bookings by date and time, newest first
            const bookings = data.bookings.sort((a, b) => {
                const dateA = new Date(`${a.booking_date.split('T')[0]}T${a.booking_time}`);
                const dateB = new Date(`${b.booking_date.split('T')[0]}T${b.booking_time}`);
                return dateB - dateA;
            });

            bookings.forEach(b => {
                const dateStr = new Date(b.booking_date).toLocaleDateString();
                const timeStr = b.booking_time ? b.booking_time.slice(0, 5) : '';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>Salon ID: ${b.business_id || ''}</td>
                    <td>${b.service_name}</td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td>${b.status}</td>
                    <td>${b.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            alert('Could not fetch bookings: ' + error);
        });
    }

    // --- Initial Page Load ---
    fetchUserBookings();
});