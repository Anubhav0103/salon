// Set your business_id here (or fetch from session/localStorage)
const business_id = localStorage.getItem('business_id') || '';
document.getElementById('business_id').value = business_id;

// Fetch catalog services and populate the select
fetch('/api/business-manage/services-catalog')
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById('catalogServiceSelect');
        select.innerHTML = '';
        (data.services || []).forEach(service => {
            const opt = document.createElement('option');
            opt.value = service.name;
            opt.textContent = service.name;
            select.appendChild(opt);
        });
    });

function fetchServices() {
    fetch(`/api/business-manage/services?business_id=${business_id}`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('serviceList');
            list.innerHTML = '';
            (data.services || []).forEach(service => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${service.name}</td>
                    <td>${service.description || ''}</td>
                    <td>${service.duration}</td>
                    <td>${service.price}</td>
                    <td>
                        <button onclick="editService(${service.service_id})">Edit</button>
                        <button onclick="deleteService(${service.service_id})">Delete</button>
                    </td>
                `;
                list.appendChild(row);
            });
        });
}

document.getElementById('addServiceForm').onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const business_id = form.business_id.value;
    const selectedServices = Array.from(form.catalog_services.selectedOptions).map(opt => opt.value);
    const description = form.description.value;
    const duration = form.duration.value;
    const price = form.price.value;
    // Add each selected service as a new row
    Promise.all(selectedServices.map(name => {
        const data = { business_id, name, description, duration, price };
        return fetch('/api/business-manage/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    })).then(() => {
        form.reset();
        fetchServices();
    });
};

window.deleteService = function(id) {
    fetch(`/api/business-manage/services/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => fetchServices());
};

window.editService = function(id) {
    fetch(`/api/business-manage/services/${id}`)
        .then(res => res.json())
        .then(data => {
            const s = data.service;
            document.getElementById('serviceName').value = s.name;
            document.getElementById('serviceDescription').value = s.description;
            document.getElementById('serviceDuration').value = s.duration;
            document.getElementById('servicePrice').value = s.price;
            document.getElementById('addServiceForm').onsubmit = function(e) {
                e.preventDefault();
                const form = e.target;
                const update = {
                    name: form.name.value,
                    description: form.description.value,
                    duration: form.duration.value,
                    price: form.price.value
                };
                fetch(`/api/business-manage/services/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(update)
                })
                .then(res => res.json())
                .then(() => {
                    form.reset();
                    fetchServices();
                    document.getElementById('addServiceForm').onsubmit = arguments.callee.caller;
                });
            };
        });
};

fetchServices(); 