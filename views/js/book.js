document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    let user = null;

    if (!token) {
        window.location.href = '/user-login';
        return; // Stop script execution if not logged in
    }

    try {
        user = jwt_decode(token);
        if (!user || user.role !== 'user') throw new Error("Invalid user role");
    } catch (e) {
        localStorage.removeItem('token');
        window.location.href = '/user-login';
        return; // Stop script execution
    }
    // --- End Authentication Check ---

    // --- Element References ---
    const bookingModal = document.getElementById('bookingModal');
    const closeBookingModal = document.getElementById('closeBookingModal');
    const bookingForm = document.getElementById('bookingForm');
    const modalTimeSlot = document.getElementById('modalTimeSlot');
    const bookingFeedback = document.getElementById('bookingFeedback');
    
    // --- Initial Setup ---
    document.getElementById('bookingDate').min = new Date().toISOString().split('T')[0];

    fetch('/api/business-manage/services-catalog')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('serviceSelect');
            select.innerHTML = '';
            (data.services || []).forEach(service => {
                select.appendChild(new Option(service.name, service.name));
            });
        });

    let userCoords = null;

    // --- Event Handlers ---
    document.getElementById('useGeolocation').onclick = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                userCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                document.getElementById('userAddress').value = `Using current location...`;
            }, () => alert('Unable to retrieve your location.'));
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    document.getElementById('findSalonsBtn').onclick = function() {
        const selectedServices = Array.from(document.getElementById('serviceSelect').selectedOptions).map(opt => opt.value);
        const bookingDate = document.getElementById('bookingDate').value;
        const address = document.getElementById('userAddress').value;

        if (!bookingDate) return alert('Please select a date.');
        if (selectedServices.length === 0) return alert('Please select at least one service.');

        function doSearch(latitude, longitude) {
            const date = new Date(bookingDate);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

            fetch('/api/users/search-salons-with-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ service_names: selectedServices, latitude, longitude, booking_date: bookingDate, day_name: dayName })
            })
            .then(res => res.json())
            .then(data => {
                const resultsDiv = document.getElementById('salonResults');
                resultsDiv.innerHTML = '';
                if (!data.salons || data.salons.length === 0) {
                    return resultsDiv.innerHTML = '<p>No salons found matching your criteria for the selected date.</p>';
                }
                data.salons.forEach(salon => {
                    const salonDiv = document.createElement('div');
                    salonDiv.className = 'salon-item';
                    salonDiv.innerHTML = `
                        <h3>${salon.salon_name}</h3>
                        <p>${salon.salon_address}</p>
                        <p class="distance">${salon.distance.toFixed(2)} km away</p>
                        <p><strong>Price:</strong> ₹${parseFloat(salon.service_price).toFixed(2)}</p>
                        <button class="book-appointment-btn" data-business-id="${salon.business_id}" data-booking-date="${bookingDate}">View Slots & Book</button>
                    `;
                    resultsDiv.appendChild(salonDiv);
                });
            });
        }

        if (userCoords) {
            doSearch(userCoords.latitude, userCoords.longitude);
        } else if (address && address !== 'Using current location...') {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) doSearch(parseFloat(data[0].lat), parseFloat(data[0].lon));
                    else alert('Could not find location for the address provided.');
                });
        } else {
            alert('Please enter an address or use your current location.');
        }
    };

    // Using event delegation for dynamically created "Book" buttons
    document.getElementById('salonResults').addEventListener('click', (e) => {
        if (e.target.classList.contains('book-appointment-btn')) {
            const businessId = e.target.dataset.businessId;
            const bookingDate = e.target.dataset.bookingDate;
            bookAppointment(businessId, bookingDate);
        }
    });

    closeBookingModal.onclick = () => bookingModal.style.display = 'none';
    window.onclick = e => { if (e.target === bookingModal) bookingModal.style.display = 'none'; };

    function bookAppointment(businessId, bookingDate) {
        const serviceName = document.getElementById('serviceSelect').value;
        if (!serviceName) return alert('Please select a service first.');

        fetch(`/api/business-manage/services?business_id=${businessId}`)
            .then(res => res.json())
            .then(data => {
                const service = (data.services || []).find(s => s.name === serviceName);
                if (!service) return alert('The selected service is not available at this salon.');
                openBookingModal(businessId, service.service_id, bookingDate, service.name, service.price);
            });
    }

    function openBookingModal(businessId, serviceId, bookingDate, serviceName, servicePrice) {
        bookingModal.style.display = 'flex';
        bookingFeedback.textContent = '';
        document.getElementById('modalBusinessId').value = businessId;
        document.getElementById('modalServiceId').value = serviceId;
        document.getElementById('modalBookingDate').value = bookingDate;
        document.getElementById('modalServiceName').textContent = serviceName;
        document.getElementById('modalServicePrice').textContent = `Price: ₹${parseFloat(servicePrice).toFixed(2)}`;

        fetch('/api/users/available-slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ business_id: Number(businessId), service_id: Number(serviceId), booking_date: bookingDate })
        })
        .then(res => res.json())
        .then(data => {
            modalTimeSlot.innerHTML = '<option value="">-- Select a time --</option>';
            if (data.slots && data.slots.length > 0) {
                data.slots.forEach(slot => modalTimeSlot.appendChild(new Option(slot, slot)));
            } else {
                modalTimeSlot.innerHTML = '<option value="" disabled>No slots available for this day</option>';
            }
        });
    }

    // ✅ FIX: This is the complete, corrected, and clean onsubmit handler.
    bookingForm.onsubmit = function(e) {
        e.preventDefault();
        bookingFeedback.textContent = 'Processing payment...';

        const priceText = document.getElementById('modalServicePrice').textContent;
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

        if (!price || price <= 0 || !modalTimeSlot.value) {
            bookingFeedback.textContent = 'Please select a valid time slot.';
            return;
        }

        fetch('/api/business-manage/razorpay/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount: price, currency: 'INR', receipt: `receipt_${Date.now()}` })
        })
        .then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err.error || 'Server rejected the request.'));
            return res.json();
        })
        .then(order => {
            const bookingData = {
                user_id: user.user_id,
                business_id: Number(document.getElementById('modalBusinessId').value),
                service_id: Number(document.getElementById('modalServiceId').value),
                booking_date: document.getElementById('modalBookingDate').value,
                booking_time: document.getElementById('modalTimeSlot').value,
                user_name: user.name,
                user_email: user.email,
                user_phone: user.phone
            };

            const options = {
                key: 'rzp_test_faeo7QJwMjht8t', // This should ideally come from the server
                amount: order.amount,
                currency: order.currency,
                name: 'Salon Appointment',
                description: `Booking for ${document.getElementById('modalServiceName').textContent}`,
                order_id: order.id,
                handler: function(response) {
                    // Payment successful, now create the final booking in the database
                    fetch('/api/business-manage/bookings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            ...bookingData,
                            payment_id: response.razorpay_payment_id,
                            payment_status: 'paid'
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) {
                            bookingFeedback.textContent = 'Payment successful, but failed to confirm booking: ' + data.error;
                        } else {
                            bookingFeedback.textContent = 'Booking Confirmed! An email has been sent.';
                            setTimeout(() => {
                                bookingModal.style.display = 'none';
                                document.getElementById('salonResults').innerHTML = '<p>Your booking is complete! Check "My Bookings" for details.</p>';
                            }, 3000);
                        }
                    });
                },
                prefill: { name: user.name, email: user.email, contact: user.phone },
                theme: { color: '#4A90E2' }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        })
        .catch(err => {
            bookingFeedback.textContent = `Failed to create payment order: ${err}`;
        });
    };

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = '/user-login';
    });
});