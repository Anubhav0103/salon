// Business Ratings Management
let currentPage = 1;
let itemsPerPage = getItemsPerPage();
let allRatings = [];
let filteredRatings = [];

// Get business_id from token
const business = JSON.parse(localStorage.getItem('business'));
const business_id = localStorage.getItem('business_id');

if (!business || !business_id) {
    alert('No business info found. Please log in as a business.');
    window.location.href = '/business-login';
}

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
    fetch(`/api/business-manage/ratings?business_id=${business_id}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching ratings:', data.error);
                document.getElementById('ratingsBody').innerHTML = '<div class="no-reviews">Error loading ratings</div>';
                return;
            }
            
            allRatings = data.ratings || [];
            filteredRatings = [...allRatings];
            
            updateStats();
            populateStaffFilter();
            renderRatings();
            renderPagination();
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('ratingsBody').innerHTML = '<div class="no-reviews">Error loading ratings</div>';
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
    
    // Clear existing options except "All Staff"
    staffFilter.innerHTML = '<option value="">All Staff</option>';
    
    // Always fetch staff from business to populate dropdown
    if (business_id) {
        fetch(`/api/business-manage/staff?business_id=${business_id}`)
            .then(res => res.json())
            .then(data => {
                // Accept both array and object responses
                let staffList = Array.isArray(data) ? data : (data.staff || []);
                if (staffList.length > 0) {
                    staffList.forEach(staff => {
                        const option = document.createElement('option');
                        option.value = staff.staff_id;
                        option.textContent = staff.name || `Staff ${staff.staff_id}`;
                        staffFilter.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching staff:', error);
            });
    } else {
        console.error('No business_id found in token');
    }
    // Also ensure rating and date range dropdowns are always populated
    populateRatingAndDateDropdowns();
}

function populateRatingAndDateDropdowns() {
    // Rating dropdown
    const ratingDropdown = document.getElementById('ratingFilter');
    if (ratingDropdown) {
        ratingDropdown.innerHTML = '<option value="">All Ratings</option>';
        [5, 4, 3, 2, 1].forEach(rating => {
            const option = document.createElement('option');
            option.value = rating;
            option.textContent = `${rating} Star${rating > 1 ? 's' : ''}`;
            ratingDropdown.appendChild(option);
        });
    }
    // Date range dropdown
    const dateDropdown = document.getElementById('dateFilter');
    if (dateDropdown) {
        dateDropdown.innerHTML = '<option value="">All Time</option>';
        const dateOptions = [
            { value: 7, label: 'Last 7 Days' },
            { value: 30, label: 'Last 30 Days' },
            { value: 90, label: 'Last 3 Months' },
            { value: 180, label: 'Last 6 Months' },
            { value: 365, label: 'Last Year' },
            { value: 730, label: 'Last 2 Years' }
        ];
        dateOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            dateDropdown.appendChild(option);
        });
    }
}

function applyFilters() {
    const staffFilter = document.getElementById('staffFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    filteredRatings = allRatings.filter(rating => {
        // Staff filter
        if (staffFilter && rating.staff_id != staffFilter) return false;
        // Rating filter (strict equality)
        if (ratingFilter && rating.rating != parseInt(ratingFilter)) return false;
        // Date filter
        if (dateFilter) {
            const reviewDate = new Date(rating.created_at);
            const daysAgo = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysAgo > parseInt(dateFilter)) return false;
        }
        // Search filter
        if (searchFilter) {
            const searchText = `${rating.review_text || ''} ${rating.user_name || ''} ${rating.service_name || ''}`.toLowerCase();
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
    
    if (filteredRatings.length === 0) {
        tbody.innerHTML = '<div class="no-reviews">No reviews found</div>';
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageRatings = filteredRatings.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    pageRatings.forEach(rating => {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        const stars = generateStars(rating.rating);
        const reviewText = rating.review_text ? (rating.review_text.length > 50 ? 
            rating.review_text.substring(0, 50) + '...' : rating.review_text) : 'No comment';
        
        row.innerHTML = `
            <div data-label="Staff Member">Staff ${rating.staff_id}</div>
            <div data-label="Service">${rating.service_name || 'N/A'}</div>
            <div data-label="Rating">
                <div class="rating-stars">${stars}</div>
                <span>(${rating.rating}/5)</span>
            </div>
            <div data-label="Review">${reviewText}</div>
            <div data-label="Customer">${rating.user_name || 'Anonymous'}</div>
            <div data-label="Date" class="date-column">${formatDate(rating.created_at)}</div>
        `;
        
        tbody.appendChild(row);
    });
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return stars;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function renderPagination() {
    const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button onclick="changePage(${i})" class="${i === currentPage ? 'current-page' : ''}">${i}</button>`;
    }
    
    // Next button
    paginationHTML += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
    
    pagination.innerHTML = paginationHTML;
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

// Initialize
fetchRatings();
populateStaffFilter();

// Test staff API endpoint
function testStaffAPI() {
    if (business_id) {
        fetch(`/api/business-manage/staff?business_id=${business_id}`)
            .then(res => {
                return res.json();
            })
            .then(data => {
            })
            .catch(error => {
                console.error('Staff API error:', error);
            });
    }
}

// Test the API
testStaffAPI();

// Test the new debug endpoint
function testDebugAPI() {
    if (business_id) {
        fetch(`/api/business-manage/test-staff?business_id=${business_id}`)
            .then(res => {
                return res.json();
            })
            .then(data => {
            })
            .catch(error => {
                console.error('Debug API error:', error);
            });
    }
}

// Test the debug API
testDebugAPI(); 