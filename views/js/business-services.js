// Get business_id from token
const business = JSON.parse(localStorage.getItem('business'));
const business_id = localStorage.getItem('business_id');
document.getElementById('business_id').value = business_id;

let editingServiceId = null;

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
                        <button onclick="editService(${service.service_id})" style="margin-right: 5px;">Edit</button>
                        <button onclick="deleteService(${service.service_id})" style="background: #ff6b6b;">Delete</button>
                    </td>
                `;
                list.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching services:', error);
        });
}

// Store the original form submission handler
const originalFormHandler = function(e) {
    e.preventDefault();
    const form = e.target;
    const business_id = form.business_id.value;
    const selectedServices = Array.from(form.catalog_services.selectedOptions).map(opt => opt.value);
    const description = form.description.value;
    const duration = form.duration.value;
    const price = form.price.value;
    
    if (selectedServices.length === 0) {
        alert('Please select at least one service');
        return;
    }
    
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
    }).catch(error => {
        console.error('Error adding service:', error);
        alert('Error adding service. Please try again.');
    });
};

document.getElementById('addServiceForm').onsubmit = originalFormHandler;

window.deleteService = function(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        fetch(`/api/business-manage/services/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert('Error deleting service: ' + data.error);
                } else {
                    fetchServices();
                }
            })
            .catch(error => {
                console.error('Error deleting service:', error);
                alert('Error deleting service. Please try again.');
            });
    }
};

window.editService = function(id) {
    editingServiceId = id;
    
    // Change form to edit mode
    const form = document.getElementById('addServiceForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const catalogSelect = document.getElementById('catalogServiceSelect');
    const descriptionInput = document.getElementById('serviceDescription');
    const durationInput = document.getElementById('serviceDuration');
    const priceInput = document.getElementById('servicePrice');
    
    // Fetch service details
    fetch(`/api/business-manage/services/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert('Error fetching service: ' + data.error);
                return;
            }
            
            const service = data.service;
            
            // Clear and set single service
            catalogSelect.innerHTML = `<option value="${service.name}" selected>${service.name}</option>`;
            descriptionInput.value = service.description || '';
            durationInput.value = service.duration;
            priceInput.value = service.price;
            
            // Change button text
            submitBtn.textContent = 'Update Service';
            
            // Change form handler to update mode
            form.onsubmit = function(e) {
                e.preventDefault();
                
                const updateData = {
                    name: catalogSelect.value,
                    description: descriptionInput.value,
                    duration: durationInput.value,
                    price: priceInput.value
                };
                
                fetch(`/api/business-manage/services/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert('Error updating service: ' + data.error);
                    } else {
                        // Reset form to add mode
                        form.reset();
                        submitBtn.textContent = 'Add Service(s)';
                        form.onsubmit = originalFormHandler;
                        editingServiceId = null;
                        fetchServices();
                        
                        // Re-populate catalog services
                        fetch('/api/business-manage/services-catalog')
                            .then(res => res.json())
                            .then(catalogData => {
                                catalogSelect.innerHTML = '';
                                (catalogData.services || []).forEach(service => {
                                    const opt = document.createElement('option');
                                    opt.value = service.name;
                                    opt.textContent = service.name;
                                    catalogSelect.appendChild(opt);
                                });
                            });
                    }
                })
                .catch(error => {
                    console.error('Error updating service:', error);
                    alert('Error updating service. Please try again.');
                });
            };
        })
        .catch(error => {
            console.error('Error fetching service:', error);
            alert('Error fetching service details. Please try again.');
        });
};

// Initialize
fetchServices(); 