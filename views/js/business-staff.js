const business_id = localStorage.getItem('business_id') || '';
document.getElementById('business_id').value = business_id;

function fetchStaff() {
    fetch(`/api/business-manage/staff?business_id=${business_id}`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('staffList');
            list.innerHTML = '';
            (data.staff || []).forEach(staff => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${staff.name}</td>
                    <td>${staff.email || ''}</td>
                    <td>${staff.phone || ''}</td>
                    <td>${staff.role}</td>
                    <td>${staff.specializations || ''}</td>
                    <td>${staff.working_days}</td>
                    <td>${staff.working_hours_start} - ${staff.working_hours_end}</td>
                    <td>
                        <button onclick="editStaff(${staff.staff_id})">Edit</button>
                        <button onclick="deleteStaff(${staff.staff_id})">Delete</button>
                    </td>
                `;
                list.appendChild(row);
            });
        });
}

document.getElementById('addStaffForm').onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const specializations = Array.from(form.specializations.selectedOptions).map(opt => opt.value).join(',');
    const working_days = Array.from(form.working_days.selectedOptions).map(opt => opt.value).join(',');
    const data = {
        business_id: form.business_id.value,
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        role: form.role.value,
        specializations: specializations,
        working_days: working_days,
        working_hours_start: form.working_hours_start.value,
        working_hours_end: form.working_hours_end.value
    };
    fetch('/api/business-manage/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        form.reset();
        fetchStaff();
    });
};

window.deleteStaff = function(id) {
    fetch(`/api/business-manage/staff/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => fetchStaff());
};

window.editStaff = function(id) {
    fetch(`/api/business-manage/staff/${id}`)
        .then(res => res.json())
        .then(data => {
            const s = data.staff;
            document.getElementById('staffName').value = s.name;
            document.getElementById('staffEmail').value = s.email;
            document.getElementById('staffPhone').value = s.phone;
            document.getElementById('staffRole').value = s.role;
            const specSelect = document.getElementById('staffSpecializations');
            Array.from(specSelect.options).forEach(opt => {
                opt.selected = s.specializations && s.specializations.split(',').map(v => v.trim()).includes(opt.value);
            });
            const daysSelect = document.getElementById('staffWorkingDays');
            Array.from(daysSelect.options).forEach(opt => {
                opt.selected = s.working_days && s.working_days.split(',').map(v => v.trim()).includes(opt.value);
            });
            document.getElementById('staffWorkingHoursStart').value = s.working_hours_start;
            document.getElementById('staffWorkingHoursEnd').value = s.working_hours_end;
            document.getElementById('addStaffForm').onsubmit = function(e) {
                e.preventDefault();
                const form = e.target;
                const specializations = Array.from(form.specializations.selectedOptions).map(opt => opt.value).join(',');
                const working_days = Array.from(form.working_days.selectedOptions).map(opt => opt.value).join(',');
                const update = {
                    name: form.name.value,
                    email: form.email.value,
                    phone: form.phone.value,
                    role: form.role.value,
                    specializations: specializations,
                    working_days: working_days,
                    working_hours_start: form.working_hours_start.value,
                    working_hours_end: form.working_hours_end.value
                };
                fetch(`/api/business-manage/staff/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(update)
                })
                .then(res => res.json())
                .then(() => {
                    form.reset();
                    fetchStaff();
                    document.getElementById('addStaffForm').onsubmit = arguments.callee.caller;
                });
            };
        });
};

// Fetch available services for staff specializations (only for this business)
fetch(`/api/business-manage/services?business_id=${business_id}`)
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById('staffSpecializations');
        select.innerHTML = '';
        (data.services || []).forEach(service => {
            const opt = document.createElement('option');
            opt.value = service.name;
            opt.textContent = service.name;
            select.appendChild(opt);
        });
    });

fetchStaff(); 