let map = null;
let userMarker = null;
let userLat = 5.9804; // Koordinat pusat Kota Kinabalu
let userLng = 116.0735;
let allRestaurants = [];
let activeMarkers = [];

// Pengiraan jarak Haversine (KM)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Buka peta automatik apabila laman dipaparkan
window.onload = async function() {
  const statusDiv = document.getElementById("status");
  
  try {
    map = L.map('map').setView([userLat, userLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    setTimeout(() => { 
      if (map) map.invalidateSize(); 
    }, 300);
  } catch (err) {
    statusDiv.innerText = "❌ Ralat memuatkan peta Leaflet. Sila semak pautan CDN.";
    return;
  }

  try {
    const res = await fetch('restaurants.json');
    allRestaurants = await res.json();
    applyFilters();
    statusDiv.innerText = "✅ Peta sedia! Menunjukkan kedai halal di Kota Kinabalu.";
  } catch (e) {
    statusDiv.innerText = "❌ Ralat memuatkan data restaurants.json.";
  }
};

function cariRestoranBerhampiran() {
  const statusDiv = document.getElementById("status");
  if (!navigator.geolocation) {
    statusDiv.innerText = "Pelayar web anda tidak menyokong fungsi GPS.";
    return;
  }

  statusDiv.innerText = "⏳ Meminta kebenaran lokasi GPS...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      map.setView([userLat, userLng], 13);

      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.circleMarker([userLat, userLng], {
        radius: 9,
        fillColor: "#0284c7",
        color: "#ffffff",
        weight: 3,
        fillOpacity: 0.9
      }).addTo(map);
      userMarker.bindPopup("<b>📍 Lokasi GPS Anda</b>").openPopup();

      applyFilters();
    },
    (err) => {
      statusDiv.innerText = "⚠️ Akses lokasi ditolak. Peta kekal memaparkan Kota Kinabalu.";
    }
  );
}

function applyFilters() {
  if (!map) return;
  const statusDiv = document.getElementById("status");
  const searchQuery = document.getElementById("searchInput").value.toLowerCase().trim();
  const maxRadius = parseFloat(document.getElementById("radiusSelect").value);

  activeMarkers.forEach(m => map.removeLayer(m));
  activeMarkers = [];

  let count = 0;

  allRestaurants.forEach(shop => {
    const dist = calculateDistance(userLat, userLng, shop.lat, shop.lng);
    const nameMatches = shop.name.toLowerCase().includes(searchQuery);
    const withinRadius = dist <= maxRadius;

    if (nameMatches && withinRadius) {
      count++;
      const marker = L.marker([shop.lat, shop.lng]).addTo(map);
      
      const popupHTML = `
        <strong style="font-size: 1rem;">${shop.name}</strong><br>
        <small style="color:#666;">${shop.company || ''}</small><br>
        <div style="margin: 4px 0;"><span class="badge-halal">Halal JAKIM</span></div>
        <small><strong>No Sijil:</strong> ${shop.certNo || '-'}</small><br>
        <small><strong>Sah Hingga:</strong> ${shop.expiry || '-'}</small><br>
        <small><strong>Alamat:</strong> ${shop.address || '-'}</small><br>
        <a class="btn-nav" href="[suspicious link removed]{shop.lat},${shop.lng}" target="_blank">🧭 Pandu Arah</a>
      `;
      marker.bindPopup(popupHTML);
      activeMarkers.push(marker);
    }
  });

  statusDiv.innerText = `✅ Ditemui ${count} restoran halal dipaparkan pada peta.`;
}
