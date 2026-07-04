// ===== متغيرات الخريطة =====
var map, currentUser = null;

// ===== أيقونات SVG المدمجة =====
var redIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
            fill="#ff4757" stroke="white" stroke-width="1.5"/>
          </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [1, -30]
});

var blueIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
            fill="#1e90ff" stroke="white" stroke-width="1.5"/>
          </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [1, -30]
});

// ===== تشغيل الخريطة =====
function startMap(user) {
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 18,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 0.5
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        noWrap: true,
        minZoom: 1,
        maxZoom: 18
    }).addTo(map);

    // موقع المستخدم (دبوس أزرق)
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        L.marker([lat, lng], {icon: blueIcon}).addTo(map).bindPopup('📍 أنت هنا');
    }, function() {
        alert('لم نتمكن من جلب موقعك، لكنك تقدر تختار أي مكان.');
    });

    // الضغط على الخريطة لكتابة رسالة
    map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        var msg = prompt('✍️ اكتب رسالتك لهذا المكان:');
        if (!msg) return;

        getUsername(function(username) {
            db.collection("messages").add({
                uid: user.uid,
                username: username || user.email.split('@')[0],
                latitude: lat,
                longitude: lng,
                message: msg,
                createdAt: new Date(),
                likes: 0,
                likedBy: []
            })
            .then(function() {
                alert('✅ تم حفظ رسالتك!');
                loadMessages();
            })
            .catch(function(err) {
                alert('❌ فشل الحفظ: ' + err.message);
            });
        });
    });

    loadMessages();
}
