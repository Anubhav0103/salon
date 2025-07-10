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
                let staffCell = '';
                let actionCell = '';
                if (app.status !== 'completed') {
                    staffCell = app.staff_id || '';
                    actionCell = `<button onclick="completeAppointment(${app.booking_id}, this)">✔️ Complete</button> ` +
                        `<button onclick="showReassignModal(${app.booking_id}, '${app.service_name.replace(/'/g, "\'")}', ${app.staff_id || 'null'})">🔄 Reassign</button>`;
                } else {
                    staffCell = app.staff_id || '';
                    actionCell = '-';
                }
                // Format date to YYYY-MM-DD
                const bookingDate = app.booking_date ? app.booking_date.split('T')[0] : '';
                row.innerHTML = `
                    <td>${app.user_name}</td>
                    <td>${app.service_name}</td>
                    <td>${staffCell}</td>
                    <td>${bookingDate}</td>
                    <td>${app.booking_time}</td>
                    <td>${app.status}</td>
                    <td>${app.payment_id || ''}</td>
                    <td>${actionCell}</td>
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

window.showReassignModal = function(booking_id, service_name, current_staff_id) {
    // Create modal
    let modal = document.getElementById('reassignModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reassignModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.4)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1000';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `<div style="background:#fff;padding:2em;border-radius:8px;min-width:350px;max-width:95vw;">
        <h3>Reassign Appointment</h3>
        <div id="eligibleStaffContainer">Loading staff...</div>
        <div style="margin-top:1em;text-align:right;">
            <button onclick="document.getElementById('reassignModal').remove()">Cancel</button>
        </div>
    </div>`;
    // Fetch eligible staff
    fetch(`/api/business-manage/eligible-staff-for-appointment?appointment_id=${booking_id}`)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('eligibleStaffContainer');
            if (!data.staff || data.staff.length === 0) {
                container.innerHTML = '<div>No eligible staff found for this service.</div>';
                return;
            }
            let html = `<select id='eligibleStaffSelect' style='width:100%;font-size:1.1em;padding:0.5em;'>`;
            data.staff.forEach(staff => {
                html += `<option value='${staff.staff_id}' ${staff.staff_id == current_staff_id ? 'selected' : ''}>${staff.name || 'Staff ' + staff.staff_id}</option>`;
            });
            html += `</select>`;
            html += `<button id='confirmReassignBtn' style='margin-left:1em;margin-top:1em;'>Confirm Reassignment</button>`;
            container.innerHTML = html;
            document.getElementById('confirmReassignBtn').onclick = function() {
                window.reassignAppointment(booking_id);
            };
        });
};

window.reassignAppointment = function(booking_id) {
    const select = document.getElementById('eligibleStaffSelect');
    const staff_id = select.value;
    fetch(`/api/business-manage/reassign-appointment/${booking_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            document.getElementById('reassignModal').remove();
            fetchAppointments();
        } else {
            alert(data.error || 'Error reassigning appointment');
        }
    });
};

fetchAppointments(); 