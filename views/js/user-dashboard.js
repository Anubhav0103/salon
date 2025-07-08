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
            (data.bookings || []).forEach(b => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${b.business_id || ''}</td>
                    <td>${b.service_name}</td>
                    <td>${b.booking_date}</td>
                    <td>${b.booking_time}</td>
                    <td>${b.status}</td>
                    <td>${b.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</td>
                `;
                tbody.appendChild(row);
            });
        });
}

fetchUserBookings(); 