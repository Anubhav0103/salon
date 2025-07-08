// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('bookingDate').min = today;

// Fetch available services and populate the select (from service_catalog)
fetch('/api/business-manage/services-catalog')
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById('serviceSelect');
        select.innerHTML = '';
        (data.services || []).forEach(service => {
            const opt = document.createElement('option');
            opt.value = service.name;
            opt.textContent = service.name;
            select.appendChild(opt);
        });
    });

let userCoords = null;

document.getElementById('useGeolocation').onclick = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            userCoords = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            };
            document.getElementById('userAddress').value = `Lat: ${userCoords.latitude}, Lon: ${userCoords.longitude}`;
        }, function() {
            alert('Unable to retrieve your location');
        });
    } else {
        alert('Geolocation is not supported by your browser');
    }
};

// Function to get day name from date
function getDayName(dateString) {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

document.getElementById('findSalonsBtn').onclick = function() {
    const selectedServices = Array.from(document.getElementById('serviceSelect').selectedOptions).map(opt => opt.value);
    const address = document.getElementById('userAddress').value;
    const bookingDate = document.getElementById('bookingDate').value;
    
    if (!bookingDate) {
        alert('Please select a date');
        return;
    }
    
    if (selectedServices.length === 0) {
        alert('Please select at least one service');
        return;
    }
    
    let lat = null, lon = null;
    if (userCoords) {
        lat = userCoords.latitude;
        lon = userCoords.longitude;
    }
    
    // If no coords, try to geocode address
    function doSearch(latitude, longitude) {
        const dayName = getDayName(bookingDate);
        
        fetch('/api/business-manage/search-salons-with-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                service_names: selectedServices, 
                latitude, 
                longitude,
                booking_date: bookingDate,
                day_name: dayName
            })
        })
        .then(res => res.json())
        .then(data => {
            const resultsDiv = document.getElementById('salonResults');
            resultsDiv.innerHTML = '';
            
            if (!data.salons || data.salons.length === 0) {
                resultsDiv.innerHTML = '<p>No salons found for your selection on this date. No staff work on ' + dayName + '.</p>';
                return;
            }
            
            data.salons.forEach(salon => {
                const salonDiv = document.createElement('div');
                salonDiv.className = 'salon-item available';
                const priceText = salon.service_price ? `<p><strong>Price:</strong> ₹${parseFloat(salon.service_price).toFixed(2)}</p>` : '';
                salonDiv.innerHTML = `
                    <h3>${salon.salon_name}</h3>
                    <p><strong>Address:</strong> ${salon.salon_address}</p>
                    <p class="distance"><strong>Distance:</strong> ${salon.distance.toFixed(2)} km</p>
                    ${priceText}
                    <p><strong>Status:</strong> Available on ${dayName}</p>
                    <button onclick="bookAppointment('${salon.business_id}', '${bookingDate}', '${salon.service_price}')">Book Appointment</button>
                `;
                resultsDiv.appendChild(salonDiv);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error searching for salons');
        });
    }
    
    if (lat && lon) {
        doSearch(lat, lon);
    } else if (address) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    doSearch(parseFloat(data[0].lat), parseFloat(data[0].lon));
                } else {
                    alert('Could not geocode address');
                }
            });
    } else {
        alert('Please enter your address or use geolocation.');
    }
};

// --- Booking Modal Logic ---
const bookingModal = document.getElementById('bookingModal');
const closeBookingModal = document.getElementById('closeBookingModal');
const bookingForm = document.getElementById('bookingForm');
const modalTimeSlot = document.getElementById('modalTimeSlot');
const bookingFeedback = document.getElementById('bookingFeedback');

function openBookingModal(businessId, serviceId, bookingDate, servicePrice) {
    bookingModal.style.display = 'flex';
    document.getElementById('modalBusinessId').value = businessId;
    document.getElementById('modalServiceId').value = serviceId;
    document.getElementById('modalBookingDate').value = bookingDate;
    bookingFeedback.textContent = '';
    // Show price in modal
    let priceDiv = document.getElementById('modalServicePrice');
    if (!priceDiv) {
        priceDiv = document.createElement('div');
        priceDiv.id = 'modalServicePrice';
        bookingForm.insertBefore(priceDiv, bookingForm.firstChild);
    }
    priceDiv.innerHTML = servicePrice ? `<strong>Price:</strong> ₹${parseFloat(servicePrice).toFixed(2)}` : '';
    // Pre-fill user info from login (if available)
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch (e) {}
    if (user) {
        document.getElementById('modalUserName').value = user.name || '';
        document.getElementById('modalUserEmail').value = user.email || '';
        document.getElementById('modalUserPhone').value = user.phone || '';
        document.getElementById('modalUserName').parentElement.style.display = 'none';
        document.getElementById('modalUserEmail').parentElement.style.display = 'none';
        document.getElementById('modalUserPhone').parentElement.style.display = 'none';
    } else {
        document.getElementById('modalUserName').parentElement.style.display = '';
        document.getElementById('modalUserEmail').parentElement.style.display = '';
        document.getElementById('modalUserPhone').parentElement.style.display = '';
    }
    // Fetch available slots
    fetch('/api/business-manage/available-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, service_id: serviceId, booking_date: bookingDate })
    })
    .then(res => res.json())
    .then(data => {
        modalTimeSlot.innerHTML = '<option value="">-- Select a time --</option>';
        (data.slots || []).forEach(slot => {
            const opt = document.createElement('option');
            opt.value = slot;
            opt.textContent = slot;
            modalTimeSlot.appendChild(opt);
        });
        if (!data.slots || data.slots.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No slots available';
            modalTimeSlot.appendChild(opt);
        }
    });
}

closeBookingModal.onclick = function() {
    bookingModal.style.display = 'none';
};

window.onclick = function(event) {
    if (event.target === bookingModal) bookingModal.style.display = 'none';
};

// --- Book Appointment Button Logic ---
window.bookAppointment = function(businessId, bookingDate, servicePrice) {
    // For now, only allow booking for one service at a time
    const selectedServices = Array.from(document.getElementById('serviceSelect').selectedOptions);
    if (selectedServices.length !== 1) {
        alert('Please select exactly one service to book an appointment.');
        return;
    }
    // Need to fetch the service_id for the selected service name
    fetch(`/api/business-manage/services?business_id=${businessId}`)
        .then(res => res.json())
        .then(data => {
            const service = (data.services || []).find(s => s.name === selectedServices[0].value);
            if (!service) {
                alert('Service not found for this business.');
                return;
            }
            openBookingModal(businessId, service.service_id, bookingDate, servicePrice);
        });
};

// --- Booking Form Submission ---
bookingForm.onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const bookingData = {
        business_id: form.business_id.value,
        service_id: form.service_id.value,
        booking_date: form.booking_date.value,
        booking_time: form.booking_time.value
    };
    // Get user info from localStorage if available
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch (e) {}
    if (user) {
        bookingData.user_name = user.name || '';
        bookingData.user_email = user.email || '';
        bookingData.user_phone = user.phone || '';
    } else {
        bookingData.user_name = form.user_name.value;
        bookingData.user_email = form.user_email.value;
        bookingData.user_phone = form.user_phone.value;
    }
    if (!bookingData.booking_time) {
        bookingFeedback.textContent = 'Please select a time slot.';
        return;
    }
    // Get price from modal
    const priceDiv = document.getElementById('modalServicePrice');
    let price = 0;
    if (priceDiv && priceDiv.textContent) {
        const match = priceDiv.textContent.match(/([\d.]+)/);
        if (match) price = parseFloat(match[1]);
    }
    if (!price) {
        bookingFeedback.textContent = 'Could not determine service price.';
        return;
    }
    // 1. Create Razorpay order
    fetch('/api/business-manage/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price, currency: 'INR', receipt: `receipt_${Date.now()}` })
    })
    .then(res => res.json())
    .then(order => {
        if (!order.id) {
            bookingFeedback.textContent = 'Failed to create payment order.';
            return;
        }
        // 2. Open Razorpay modal
        const options = {
            key: 'rzp_test_02QN3R2N4m2GAQ', // Use your Razorpay key
            amount: order.amount,
            currency: order.currency,
            name: 'Salon Booking',
            description: 'Service Payment',
            order_id: order.id,
            handler: function (response) {
                console.log('Razorpay payment response:', response);
                // 3. On payment success, create booking
                fetch('/api/business-manage/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...bookingData, payment_id: response.razorpay_payment_id, payment_status: 'paid' })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        bookingFeedback.textContent = data.error;
                    } else {
                        bookingFeedback.textContent = 'Booking confirmed!';
                        setTimeout(() => {
                            bookingModal.style.display = 'none';
                        }, 1500);
                    }
                })
                .catch(() => {
                    bookingFeedback.textContent = 'Error submitting booking.';
                });
            },
            prefill: {
                name: bookingData.user_name,
                email: bookingData.user_email,
                contact: bookingData.user_phone
            },
            theme: { color: '#3399cc' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    });
}; 