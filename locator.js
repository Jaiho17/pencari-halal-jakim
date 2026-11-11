let map = null;
let restaurants = [
  {
    id: 1,
    rank: 1,
    name: "Restoran Selera Kampung KK",
    company: "Selera KK Sdn Bhd",
    certNo: "JAKIM.700-2/3/1 012-04/2024",
    expiry: "31/12/2026",
    address: "No. 12, Jalan Gaya, 88000 Kota Kinabalu, Sabah",
    lat: 5.9820,
    lng: 116.0750,
    openHour: 7,
    closeHour: 22,
    hoursText: "07:00 AM - 10:00 PM (Setiap Hari)"
  },
  {
    id: 2,
    rank: 2,
    name: "D'Anjung Seafood Halal",
    company: "Anjung Rasa Enterprise",
    certNo: "JAKIM.700-2/3/1 102-01/2024",
    expiry: "28/02/2026",
    address: "Anjung Senia, 88000 Kota Kinabalu, Sabah",
    lat: 5.9750,
    lng: 116.0680,
    openHour: 11,
    closeHour: 23,
    hoursText: "11:00 AM - 11:00 PM (Isnin - Ahad)"
  },
  {
    id: 3,
    rank: 3,
    name: "Kedai Kopi & Roti Sabah Halal",
    company: "Borneo Foodies Sdn Bhd",
    certNo: "JAKIM.700-2/3/1 105-05/2025",
    expiry: "15/10/2026",
    address: "Inanam Plaza, 88450 Kota Kinabalu, Sabah",
    lat: 5.9890,
    lng: 116.0820,
    openHour: 6,
    closeHour: 18,
    hoursText: "06:00 AM - 06:00 PM (Isnin - Sabtu)"
  },
  {
    id: 4,
    rank: 4,
    name: "Nasi Kukus D'Likas Halal",
    company: "Warisan Likas Enterprise",
    certNo: "JAKIM.700-2/3/1 204-08/2025",
    expiry: "20/12/2027",
    address: "Jalan Likas, 88400 Kota Kinabalu, Sabah",
    lat: 5.9950,
    lng: 116.1010,
    openHour: 10,
    closeHour: 21,
    hoursText: "10:00 AM - 09:00 PM (Setiap Hari)"
  },
  {
    id: 5,
    rank: 5,
    name: "Restoran Tanjung Aru Breeze",
    company: "Tanjung Bay Sdn Bhd",
    certNo: "JAKIM.700-2/3/1 301-11/2024",
    expiry: "30/06/2026",
    address: "Plaza Tanjung Aru, 88100 Kota Kinabalu, Sabah",
    lat: 5.9480,
    lng: 116.0450,
    openHour: 12,
    closeHour: 24,
    hoursText: "12:00 PM - 12:00 AM (Isnin - Ahad)"
  }
];

let markersMap = {};
let userLat = 5.9804; // Kota Kinabalu
let userLng = 116.0735;
let userMarker = null;
let currentRouteLine = null;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 2;
}

function isStoreOpen(shop) {
  const currentHour = new Date().getHours();
  return currentHour >= shop.openHour && currentHour < shop.closeHour;
}

window.onload = async function() {
  map = L.map('map').setView([userLat, userLng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  setTimeout(() => { if (map) map.invalidateSize(); }, 300);

  map.on('dragend', () => {
    const center = map.getCenter();
    reorderStoresByCenter(center.lat, center.lng);
  });

  try {
    const res = await fetch('restaurants.json');
    if (res.ok) {
      const externalData = await res.json();
      if (externalData && externalData.length > 0) {
        restaurants = externalData;
      }
    }
  } catch (e) {
    console.log("Menggunakan data sedia ada.");
  }

  reorderStoresByCenter(userLat, userLng);
};

function reorderStoresByCenter(centerLat, centerLng) {
  restaurants.forEach(shop => {
    shop.distance = calculateDistance(centerLat, centerLng, shop.lat, shop.lng);
    shop.isOpen = isStoreOpen(shop);
  });

  restaurants.sort((a, b) => a.distance - b.distance);
  restaurants.forEach((shop, index) => shop.rank = index + 1);

  renderListAndPins();
}

function renderListAndPins() {
  const listContainer = document.getElementById('storeList');
  const showOpenOnly = document.getElementById('openNowToggle').checked;
  listContainer.innerHTML = '';

  Object.values(markersMap).forEach(m => map.removeLayer(m));
  markersMap = {};

  let visibleCount = 0;

  restaurants.forEach(shop => {
    if (showOpenOnly && !shop.isOpen) return;
    visibleCount++;

    const card = document.createElement('div');
    card.className = 'store-card';
    card.id = `card-${shop.id}`;
    card.innerHTML = `
      <div class="card-header">
        <span class="rank-badge">#${shop.rank}</span>
        <span class="store-name">${shop.name}</span>
        <span class="status-badge ${shop.isOpen ? 'status-open' : 'status-closed'}">
          ${shop.isOpen ? 'BUKA' : 'TUTUP'}
        </span>
      </div>
      <div class="card-body">
        <div>📍 ${shop.address}</div>
        <div>📏 ${shop.distance.toFixed(2)} km dari pusat peta</div>
      </div>
      <div class="details-unfold">
        <div><strong>Syarikat:</strong> ${shop.company}</div>
        <div><strong>No. Sijil JAKIM:</strong> ${shop.certNo}</div>
        <div><strong>Sah Hingga:</strong> ${shop.expiry}</div>
        <div><strong>Waktu Operasi:</strong> ${shop.hoursText}</div>
        <button class="btn-directions" onclick="drawRouteToStore(${shop.id}, event)">
          🧭 Petunjuk Laluan (Directions)
        </button>
      </div>
    `;

    card.addEventListener('mouseenter', () => highlightAndFlyToPin(shop.id));
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
      highlightAndFlyToPin(shop.id);
    });

    listContainer.appendChild(card);

    const pinClass = shop.isOpen ? 'pin-open' : 'pin-closed';
    const customIcon = L.divIcon({
      className: '',
      html: `<div class="custom-pin ${pinClass}"><span>${shop.rank}</span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    const marker = L.marker([shop.lat, shop.lng], { icon: customIcon }).addTo(map);
    
    const popupContent = `
      <strong>#${shop.rank} ${shop.name}</strong><br>
      <small>${shop.address}</small><br>
      <small>Status: <b>${shop.isOpen ? 'BUKA' : 'TUTUP'}</b></small>
    `;
    marker.bindPopup(popupContent);
    markersMap[shop.id] = marker;
  });

  document.getElementById('statusText').innerText = `Menampilkan ${visibleCount} restoran halal di Kota Kinabalu.`;
}

function highlightAndFlyToPin(id) {
  document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById(`card-${id}`);
  if (card) card.classList.add('active');

  const shop = restaurants.find(s => s.id === id);
  if (shop && markersMap[id]) {
    map.flyTo([shop.lat, shop.lng], 15, { duration: 1.0 });
    markersMap[id].openPopup();
  }
}

function drawRouteToStore(id, event) {
  if (event) event.stopPropagation();
  const shop = restaurants.find(s => s.id === id);
  if (!shop) return;

  if (currentRouteLine) map.removeLayer(currentRouteLine);

  currentRouteLine = L.polyline([
    [userLat, userLng],
    [shop.lat, shop.lng]
  ], {
    color: '#f97316',
    weight: 4,
    dashArray: '8, 8',
    opacity: 0.9
  }).addTo(map);

  map.fitBounds(currentRouteLine.getBounds(), { padding: [40, 40] });
}

function locateUserAndFindNearest() {
  if (!navigator.geolocation) {
    alert("Pelayar anda tidak menyokong perkongsian lokasi GPS.");
    return;
  }

  document.getElementById('statusText').innerText = "⏳ Mengesan lokasi GPS anda...";

  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude;

    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([userLat, userLng], {
      radius: 8,
      fillColor: '#0284c7',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 0.9
    }).addTo(map).bindPopup("<b>📍 Lokasi GPS Anda</b>");

    reorderStoresByCenter(userLat, userLng);

    const nearestOpen = restaurants.find(s => s.isOpen);
    if (nearestOpen) {
      drawRouteToStore(nearestOpen.id);
      highlightAndFlyToPin(nearestOpen.id);
    }
  }, () => {
    alert("Kebenaran lokasi ditolak. Memaparkan lokasi lalai Kota Kinabalu.");
  });
}

function toggleOpenNow() {
  renderListAndPins();
}
