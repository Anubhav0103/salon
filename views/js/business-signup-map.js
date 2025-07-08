let map, marker;
function showMap(lat, lon) {
    if (!map) {
        map = L.map('map').setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);
        marker = L.marker([lat, lon]).addTo(map);
    } else {
        map.setView([lat, lon], 15);
        marker.setLatLng([lat, lon]);
    }
}

function geocodeAndShowMap(address) {
    if (!address) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                showMap(parseFloat(data[0].lat), parseFloat(data[0].lon));
            }
        });
}

document.getElementById('businessAddress').addEventListener('input', function() {
    const address = this.value;
    geocodeAndShowMap(address);
}); 