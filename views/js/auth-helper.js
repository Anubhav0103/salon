function getBusinessInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/business-login';
        return null;
    }
    try {
        // Assumes jwt_decode is loaded globally via a CDN
        const decoded = jwt_decode(token);
        if (decoded.role !== 'business') {
            // This token is not for a business user
            window.location.href = '/business-login';
            return null;
        }
        return decoded; // Returns the full payload: { business_id, salon_name, email, role, ... }
    } catch (error) {
        console.error("Invalid token:", error);
        window.location.href = '/business-login';
        return null;
    }
}

function logoutBusiness() {
    localStorage.removeItem('token');
    window.location.href = '/business-login';
}