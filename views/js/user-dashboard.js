// Get user from localStorage
let user = null;
try { user = JSON.parse(localStorage.getItem('user')); } catch (e) {}
if (!user || !user.email) {
    alert('Please log in to view your bookings.');
    window.location.href = '/user-login';
}

function fetchUserBookings() {
    fetch(`/api/users/bookings?user_email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('userBookingsBody');
            tbody.innerHTML = '';
            // Sort bookings by date and time, newest first
            const bookings = (data.bookings || []).slice().sort((a, b) => {
                const dateA = new Date(a.booking_date + 'T' + a.booking_time);
                const dateB = new Date(b.booking_date + 'T' + b.booking_time);
                return dateB - dateA;
            });
            bookings.forEach(b => {
                // Format date and time
                const dateStr = b.booking_date ? new Date(b.booking_date).toISOString().split('T')[0] : '';
                const timeStr = b.booking_time ? b.booking_time.slice(0,5) : '';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${b.business_id || ''}</td>
                    <td>${b.service_name}</td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td>${b.status}</td>
                    <td>${b.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</td>
                `;
                tbody.appendChild(row);
            });
        });
}

fetchUserBookings(); 