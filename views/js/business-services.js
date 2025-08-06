document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Logic ---
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Authentication error. Please log in again.");
        window.location.href = '/business-login';
        return;
    }
    let businessInfo;
    try {
        businessInfo = jwt_decode(token);
        if (businessInfo.role !== 'business') throw new Error("Not a business user");
    } catch (error) {
        alert("Session is invalid or expired. Please log in again.");
        window.location.href = '/business-login';
        return;
    }
    const business_id = businessInfo.business_id;
    // --- End of Authentication Logic ---

    // --- Element & State References ---
    let editingServiceId = null;
    const form = document.getElementById('addServiceForm');
    const catalogSelect = document.getElementById('catalogServiceSelect');
    const submitButton = form.querySelector('button[type="submit"]');
    const serviceList = document.getElementById('serviceList');
    document.getElementById('business_id').value = business_id;

    // --- Event Listener Setup ---
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/business-login';
        });
    }

    serviceList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName === 'BUTTON' && target.dataset.id) {
            const serviceId = target.dataset.id;
            if (target.classList.contains('edit-btn')) {
                switchToEditMode(serviceId);
            }
            if (target.classList.contains('delete-btn')) {
                deleteService(serviceId);
            }
        }
    });

    // --- Form Handlers ---
    const handleAdd = (e) => {
        e.preventDefault();
        const selectedServices = Array.from(catalogSelect.selectedOptions).map(opt => opt.value);
        if (selectedServices.length === 0) return alert('Please select at least one service.');
        const serviceData = {
            business_id,
            description: form.description.value,
            duration: Number(form.duration.value),
            price: Number(form.price.value)
        };
        const addPromises = selectedServices.map(name =>
            fetch('/api/business-manage/services', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...serviceData, name })
            }).then(handleResponse)
        );
        Promise.all(addPromises).then(() => {
            resetFormToAddMode();
            fetchServices();
        }).catch(handleError);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        const updateData = {
            name: catalogSelect.value, // Read the currently selected name
            description: form.description.value,
            duration: Number(form.duration.value),
            price: Number(form.price.value)
        };
        fetch(`/api/business-manage/services/${editingServiceId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        })
        .then(handleResponse).then(() => {
            resetFormToAddMode();
            fetchServices();
        }).catch(handleError);
    };

    // --- Helper & Core Functions ---
    function handleResponse(res) {
        if (!res.ok) return res.json().then(err => Promise.reject(err.error || 'An unknown server error occurred.'));
        return res.json();
    }

    function handleError(error) {
        console.error('API Error:', error);
        alert('An error occurred: ' + error);
    }

    function fetchCatalogServices() {
        // ✅ FIX: This function now returns the fetch promise
        return fetch('/api/business-manage/services-catalog', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(handleResponse)
            .then(data => {
                catalogSelect.innerHTML = '';
                (data.services || []).forEach(service => {
                    catalogSelect.appendChild(new Option(service.name, service.name));
                });
            });
    }

    function fetchServices() {
        fetch(`/api/business-manage/services?business_id=${business_id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(handleResponse).then(data => {
                serviceList.innerHTML = '';
                (data.services || []).forEach(service => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${service.name}</td>
                        <td>${service.description || ''}</td>
                        <td>${service.duration} min</td>
                        <td>₹${service.price}</td>
                        <td>
                            <button data-id="${service.service_id}" class="action-btn edit-btn">Edit</button>
                            <button data-id="${service.service_id}" class="action-btn delete-btn">Delete</button>
                        </td>
                    `;
                    serviceList.appendChild(row);
                });
            }).catch(handleError);
    }

    function resetFormToAddMode() {
        editingServiceId = null;
        form.reset();
        submitButton.textContent = 'Add Service(s)';
        catalogSelect.disabled = false;
        catalogSelect.multiple = true;
        const cancelButton = document.getElementById('cancelEditBtn');
        if (cancelButton) cancelButton.remove();
        fetchCatalogServices();
        form.onsubmit = handleAdd;
    }

    // ✅ FIX: The entire logic for switching to edit mode is new and correct.
    function switchToEditMode(id) {
        // First, get the details of the service to edit
        fetch(`/api/business-manage/services/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(handleResponse)
            .then(data => {
                editingServiceId = id;
                const service = data.service;

                // Populate the text fields
                form.description.value = service.description || '';
                form.duration.value = service.duration;
                form.price.value = service.price;

                // Now, fetch the entire catalog and then select the current service's name
                fetchCatalogServices().then(() => {
                    catalogSelect.value = service.name;
                });

                // Configure the form for "Edit Mode"
                catalogSelect.disabled = false; // The dropdown is NOT disabled
                catalogSelect.multiple = false; // But you can only edit one at a time
                submitButton.textContent = 'Update Service';
                form.onsubmit = handleUpdate;

                // Add a cancel button if it doesn't exist
                if (!document.getElementById('cancelEditBtn')) {
                    const cancelButton = document.createElement('button');
                    cancelButton.type = 'button';
                    cancelButton.id = 'cancelEditBtn';
                    cancelButton.textContent = 'Cancel Edit';
                    cancelButton.style.marginLeft = '10px';
                    cancelButton.onclick = resetFormToAddMode;
                    submitButton.after(cancelButton);
                }
            })
            .catch(handleError);
    }

    function deleteService(id) {
        if (confirm('Are you sure you want to delete this service?')) {
            fetch(`/api/business-manage/services/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(handleResponse).then(() => {
                if (id == editingServiceId) {
                    resetFormToAddMode();
                }
                fetchServices();
            }).catch(handleError);
        }
    }

    // --- Initial Page Load ---
    resetFormToAddMode();
    fetchServices();
});