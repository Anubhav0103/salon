document.addEventListener('DOMContentLoaded', function() {
    // ✅ FIX: Get the token from localStorage.
    const token = localStorage.getItem('token');

    // ✅ FIX: Check for token and decode it to get business info.
    if (!token) {
        alert("Authentication error. Please log in again.");
        window.location.href = '/business-login';
        return;
    }
    
    let businessInfo;
    try {
        businessInfo = jwt_decode(token);
    } catch (error) {
        alert("Session is invalid or expired. Please log in again.");
        window.location.href = '/business-login';
        return;
    }
    
    const business_id = businessInfo.business_id;
    // --- End of new authentication logic ---

    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/business-login';
        });
    }

    function fetchAppointments() {
        fetch(`/api/business-manage/appointments?business_id=${business_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('appointmentsBody');
            tbody.innerHTML = '';
            (data.appointments || []).forEach(app => {
                const row = document.createElement('tr');
                let staffCell = app.staff_id ? `ID: ${app.staff_id}` : '<i>Unassigned</i>';
                let actionCell = '';

                if (app.status !== 'completed') {
                    actionCell = `
                        <button class="action-btn complete-btn" data-booking-id="${app.booking_id}">✔️ Complete</button>
                        <button class="action-btn reassign-btn" data-booking-id="${app.booking_id}">🔄 Reassign</button>
                    `;
                } else {
                    actionCell = '✅ Completed';
                }

                const bookingDate = app.booking_date ? app.booking_date.split('T')[0] : '';
                row.innerHTML = `
                    <td>${app.user_name}</td>
                    <td>${app.service_name}</td>
                    <td>${staffCell}</td>
                    <td>${bookingDate}</td>
                    <td>${app.booking_time}</td>
                    <td><span class="status ${app.status}">${app.status}</span></td>
                    <td>${app.payment_id || 'N/A'}</td>
                    <td>${actionCell}</td>
                `;
                tbody.appendChild(row);
            });
        });
    }

    function completeAppointment(booking_id) {
        if (!confirm('Mark this appointment as complete? A review link will be sent.')) return;
        fetch(`/api/business-manage/appointments/${booking_id}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert(data.message);
            fetchAppointments();
        })
        .catch(err => alert("Error completing appointment: " + err.message));
    }

    document.getElementById('appointmentsBody').addEventListener('click', function(e) {
        if (e.target.classList.contains('complete-btn')) {
            completeAppointment(e.target.dataset.bookingId);
        }
        if (e.target.classList.contains('reassign-btn')) {
            showReassignModal(e.target.dataset.bookingId);
        }
    });

    window.showReassignModal = function(booking_id) {
        let modal = document.getElementById('reassignModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'reassignModal';
            document.body.appendChild(modal);
        }
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Reassign Appointment</h3>
                <div id="eligibleStaffContainer">Loading available staff...</div>
                <div class="modal-actions">
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>`;
        
        modal.querySelector('.cancel-btn').onclick = () => modal.remove();
        
        fetch(`/api/business-manage/eligible-staff-for-appointment?appointment_id=${booking_id}`, {
             headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('eligibleStaffContainer');
            if (data.error || !data.staff || data.staff.length === 0) {
                container.innerHTML = '<p>No other staff members are available for this slot.</p>';
                return;
            }
            container.innerHTML = `
                <select id='eligibleStaffSelect'>
                    ${data.staff.map(staff => `<option value='${staff.staff_id}'>${staff.name}</option>`).join('')}
                </select>
                <button id='confirmReassignBtn' class="action-btn">Confirm</button>
            `;
            document.getElementById('confirmReassignBtn').onclick = () => reassignAppointment(booking_id);
        });
    };

    window.reassignAppointment = function(booking_id) {
        const staff_id = document.getElementById('eligibleStaffSelect').value;
        fetch(`/api/business-manage/reassign-appointment/${booking_id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ staff_id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert(data.message);
            document.getElementById('reassignModal').remove();
            fetchAppointments();
        })
        .catch(err => alert("Error reassigning: " + err.message));
    };

    fetchAppointments();
});