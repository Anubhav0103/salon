document.addEventListener('DOMContentLoaded', function() {
    // --- New Authentication Logic ---
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Authentication error. Please log in again.");
        window.location.href = '/business-login';
        return;
    }

    let businessInfo;
    try {
        // Assumes jwt-decode.min.js is loaded from a CDN in your HTML
        businessInfo = jwt_decode(token);
        if (businessInfo.role !== 'business') throw new Error("Not a business user");
    } catch (error) {
        alert("Session is invalid or expired. Please log in again.");
        window.location.href = '/business-login';
        return;
    }

    const business_id = businessInfo.business_id;
    // --- End of New Authentication Logic ---

    // State variables
    let currentPage = 1;
    let itemsPerPage = getItemsPerPage();
    let allRatings = [];
    let filteredRatings = [];

    // This function will override the simple one in your HTML, making it work correctly
    window.logout = function() {
        localStorage.removeItem('token');
        window.location.href = '/business-login'; // Correctly redirects to business login
    };

    // Responsive pagination
    function getItemsPerPage() {
        const width = window.innerWidth;
        if (width <= 768) return 5; // Mobile
        if (width <= 1024) return 7; // Tablet
        return 10; // Desktop
    }

    // Update items per page when window resizes
    window.addEventListener('resize', () => {
        itemsPerPage = getItemsPerPage();
        renderRatings();
        renderPagination();
    });

    function fetchRatings() {
        fetch(`/api/business-manage/ratings?business_id=${business_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                allRatings = data.ratings || [];
                filteredRatings = [...allRatings];

                updateStats();
                populateStaffFilter();
                renderRatings();
                renderPagination();
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('ratingsBody').innerHTML = `<div class="no-reviews">Error loading ratings: ${error.message}</div>`;
            });
    }

    function updateStats() {
        const totalReviews = allRatings.length;
        const avgRating = totalReviews > 0 ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
        const uniqueStaff = new Set(allRatings.map(r => r.staff_id)).size;
        const fiveStarReviews = allRatings.filter(r => r.rating === 5).length;

        document.getElementById('totalReviews').textContent = totalReviews;
        document.getElementById('avgRating').textContent = avgRating;
        document.getElementById('totalStaff').textContent = uniqueStaff;
        document.getElementById('fiveStarReviews').textContent = fiveStarReviews;
    }

    function populateStaffFilter() {
        const staffFilter = document.getElementById('staffFilter');
        staffFilter.innerHTML = '<option value="">All Staff</option>';

        fetch(`/api/business-manage/staff?business_id=${business_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                let staffList = data.staff || [];
                if (staffList.length > 0) {
                    staffList.forEach(staff => {
                        const option = document.createElement('option');
                        option.value = staff.staff_id;
                        option.textContent = staff.name || `Staff ${staff.staff_id}`;
                        staffFilter.appendChild(option);
                    });
                }
            })
            .catch(error => console.error('Error fetching staff for filter:', error));
    }
    
    // This function was not in your original file but is needed for the other filters to populate
    function populateRatingAndDateDropdowns() {
        const ratingDropdown = document.getElementById('ratingFilter');
        if (ratingDropdown.options.length <= 1) { // Populate only if not already populated
            [5, 4, 3, 2, 1].forEach(rating => {
                ratingDropdown.appendChild(new Option(`${rating} Star${rating > 1 ? 's' : ''}`, rating));
            });
        }
        
        const dateDropdown = document.getElementById('dateFilter');
        if (dateDropdown.options.length <=1) {
             const dateOptions = [ { value: 7, label: 'Last 7 Days' }, { value: 30, label: 'Last 30 Days' }, { value: 90, label: 'Last 3 Months' }, { value: 180, label: 'Last 6 Months' }, { value: 365, label: 'Last Year' }];
             dateOptions.forEach(opt => dateDropdown.appendChild(new Option(opt.label, opt.value)));
        }
    }


    function applyFilters() {
        const staffFilter = document.getElementById('staffFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();

        filteredRatings = allRatings.filter(rating => {
            if (staffFilter && rating.staff_id != staffFilter) return false;
            if (ratingFilter && rating.rating != parseInt(ratingFilter)) return false;
            if (dateFilter) {
                const reviewDate = new Date(rating.created_at);
                const daysAgo = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysAgo > parseInt(dateFilter)) return false;
            }
            if (searchFilter) {
                const searchText = `${rating.review_text || ''} ${rating.user_name || ''} ${rating.service_name || ''} ${rating.staff_name || ''}`.toLowerCase();
                if (!searchText.includes(searchFilter)) return false;
            }
            return true;
        });

        currentPage = 1;
        renderRatings();
        renderPagination();
    }

    function renderRatings() {
        const tbody = document.getElementById('ratingsBody');
        tbody.innerHTML = '';
        if (filteredRatings.length === 0) {
            tbody.innerHTML = '<div class="no-reviews">No reviews found matching your criteria.</div>';
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const pageRatings = filteredRatings.slice(startIndex, startIndex + itemsPerPage);

        pageRatings.forEach(rating => {
            const row = document.createElement('div');
            row.className = 'table-row';
            const stars = '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating);
            const reviewText = rating.review_text || '<i>No comment provided.</i>';

            row.innerHTML = `
                <div data-label="Staff Member">${rating.staff_name || `Staff ID: ${rating.staff_id}`}</div>
                <div data-label="Service">${rating.service_name || 'N/A'}</div>
                <div data-label="Rating">
                    <div class="rating-stars">${stars}</div>
                    <span>(${rating.rating}/5)</span>
                </div>
                <div data-label="Review">${reviewText}</div>
                <div data-label="Customer">${rating.user_name || 'Anonymous'}</div>
                <div data-label="Date" class="date-column">${new Date(rating.created_at).toLocaleDateString()}</div>
            `;
            tbody.appendChild(row);
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => changePage(currentPage - 1);
        pagination.appendChild(prevButton);

        // Page number buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = i === currentPage ? 'current-page' : '';
            pageButton.onclick = () => changePage(i);
            pagination.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => changePage(currentPage + 1);
        pagination.appendChild(nextButton);
    }

    function changePage(page) {
        const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            renderRatings();
            renderPagination();
        }
    }

    // Event listeners
    document.getElementById('staffFilter').addEventListener('change', applyFilters);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    document.getElementById('searchFilter').addEventListener('input', applyFilters);

    // Initial load
    populateRatingAndDateDropdowns();
    fetchRatings();
});