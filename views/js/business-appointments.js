// Get business_id from localStorage or prompt
const business_id = localStorage.getItem('business_id');
if (!business_id) {
    alert('No business_id found. Please log in as a business.');
}

function fetchAppointments() {
    fetch(`/api/business-manage/appointments?business_id=${business_id}`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('appointmentsBody');
            tbody.innerHTML = '';
            (data.appointments || []).forEach(app => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${app.user_name}</td>
                    <td>${app.service_name}</td>
                    <td>${app.staff_id || ''}</td>
                    <td>${app.booking_date}</td>
                    <td>${app.booking_time}</td>
                    <td>${app.status}</td>
                    <td>${app.payment_id || ''}</td>
                    <td><button onclick="completeAppointment(${app.booking_id}, this)">✔️ Complete</button></td>
                `;
                tbody.appendChild(row);
            });
        });
}

window.completeAppointment = function(booking_id, btn) {
    fetch(`/api/business-manage/appointments/${booking_id}/complete`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            // Remove row from table
            btn.closest('tr').remove();
        } else {
            alert(data.error || 'Error updating appointment');
        }
    });
};

fetchAppointments(); 