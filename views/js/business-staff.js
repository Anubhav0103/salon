document.addEventListener('DOMContentLoaded', () => {
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
        // Assumes jwt-decode.min.js is loaded from a CDN in your HTML.
        businessInfo = jwt_decode(token);
    } catch (error) {
        alert("Session is invalid or expired. Please log in again.");
        window.location.href = '/business-login';
        return;
    }

    // Extract the business_id from the decoded token.
    const business_id = businessInfo.business_id;

    // --- End of new authentication logic ---

    const businessIdInput = document.getElementById('business_id');
    if (businessIdInput) businessIdInput.value = business_id;

    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/business-login';
        });
    }

    function fetchStaff() {
        fetch(`/api/business-manage/staff?business_id=${business_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('staffList');
            list.innerHTML = '';
            (data.staff || []).forEach(staff => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="Name">${staff.name}</td>
                    <td data-label="Email" class="hide-on-tablet">${staff.email || ''}</td>
                    <td data-label="Phone" class="hide-on-tablet">${staff.phone || ''}</td>
                    <td data-label="Role">${staff.role}</td>
                    <td data-label="Specializations" class="hide-on-tablet specializations-cell">${staff.specializations || ''}</td>
                    <td data-label="Working Days" class="hide-on-mobile working-days-cell">${staff.working_days}</td>
                    <td data-label="Working Hours">${staff.working_hours_start} - ${staff.working_hours_end}</td>
                    <td data-label="Actions">
                        <button class="action-btn edit-btn" onclick="editStaff(${staff.staff_id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteStaff(${staff.staff_id})">Delete</button>
                    </td>
                `;
                list.appendChild(row);
            });
        })
        .catch(err => console.error("Error fetching staff:", err));
    }

    const form = document.getElementById('addStaffForm');
    const originalStaffFormHandler = function(e) {
        e.preventDefault();
        const specializations = Array.from(form.specializations.selectedOptions).map(opt => opt.value).join(',');
        const working_days = Array.from(form.working_days.selectedOptions).map(opt => opt.value).join(',');
        const data = {
            business_id: business_id,
            name: form.name.value,
            email: form.email.value,
            phone: form.phone.value,
            role: form.role.value,
            specializations,
            working_days,
            working_hours_start: form.working_hours_start.value,
            working_hours_end: form.working_hours_end.value
        };
        fetch('/api/business-manage/staff', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            form.reset();
            fetchStaff();
        })
        .catch(err => {
            console.error("Error adding staff:", err);
            alert("Failed to add staff.");
        });
    };

    if (form) {
        form.onsubmit = originalStaffFormHandler;
    }

    window.deleteStaff = function(id) {
        fetch(`/api/business-manage/staff/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                fetchStaff();
            }
        })
        .catch(err => console.error("Error deleting staff:", err));
    };

    window.editStaff = function(id) {
        fetch(`/api/business-manage/staff/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            const s = data.staff;
            
            document.getElementById('staffName').value = s.name;
            document.getElementById('staffEmail').value = s.email;
            document.getElementById('staffPhone').value = s.phone;
            document.getElementById('staffRole').value = s.role;
            document.getElementById('staffWorkingHoursStart').value = s.working_hours_start;
            document.getElementById('staffWorkingHoursEnd').value = s.working_hours_end;
            
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const specSelect = document.getElementById('staffSpecializations');
            const selectedSpecs = s.specializations ? s.specializations.split(',').map(str => str.trim()) : [];
            Array.from(specSelect.options).forEach(opt => opt.selected = selectedSpecs.includes(opt.value));
    
            const daysSelect = document.getElementById('staffWorkingDays');
            const selectedDays = s.working_days ? s.working_days.split(',').map(str => str.trim()) : [];
            Array.from(daysSelect.options).forEach(opt => opt.selected = selectedDays.includes(opt.value));
    
            const submitBtn = document.querySelector('#addStaffForm button[type="submit"]');
            submitBtn.textContent = 'Update Staff';
    
            document.getElementById('addStaffForm').onsubmit = function(e) {
                e.preventDefault();
                const form = e.target;
                const update = {
                    business_id: parseInt(business_id),
                    name: form.name.value,
                    email: form.email.value,
                    phone: form.phone.value,
                    role: form.role.value,
                    specializations: Array.from(form.specializations.selectedOptions).map(opt => opt.value).join(','),
                    working_days: Array.from(form.working_days.selectedOptions).map(opt => opt.value).join(','),
                    working_hours_start: form.working_hours_start.value,
                    working_hours_end: form.working_hours_end.value
                };
    
                fetch(`/api/business-manage/staff/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(update)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert('Error updating staff: ' + data.error);
                    } else {
                        form.reset();
                        submitBtn.textContent = 'Add Staff';
                        document.getElementById('addStaffForm').onsubmit = originalStaffFormHandler;
                        fetchStaff();
                    }
                })
                .catch(err => {
                    console.error('Error updating staff:', err);
                    alert('Error updating staff.');
                });
            };
        });
    };
    
    fetch(`/api/business-manage/services?business_id=${business_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById('staffSpecializations');
        if (!select) return;
        select.innerHTML = '';
        (data.services || []).forEach(service => {
            const opt = document.createElement('option');
            opt.value = service.name;
            opt.textContent = service.name;
            select.appendChild(opt);
        });
    })
    .catch(err => console.error("Error fetching services for specialization list:", err));
    
    fetchStaff();
});