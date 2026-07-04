// ======================================================
// ===== دوال الخريطة =====
// ======================================================

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

    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        L.marker([lat, lng]).addTo(map).bindPopup('📍 أنت هنا');
    }, function() {
        alert('لم نتمكن من جلب موقعك، لكنك تقدر تختار أي مكان.');
    });

    map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        var msg = prompt('✍️ اكتب رسالتك لهذا المكان:');
        if (!msg) return;

        db.collection("messages").add({
            uid: user.uid,
            username: user.email || 'مجهول',
            latitude: lat,
            longitude: lng,
            message: msg,
            createdAt: new Date()
        })
        .then(function() {
            alert('✅ تم حفظ رسالتك!');
            loadMessages();
        })
        .catch(function(err) {
            alert('❌ فشل الحفظ: ' + err.message);
        });
    });

    loadMessages();
}

function loadMessages() {
    map.eachLayer(function(layer) {
        if (!!layer.getPopup || !!layer._popup) {
            map.removeLayer(layer);
        }
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        noWrap: true,
        minZoom: 1,
        maxZoom: 18
    }).addTo(map);

    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        L.marker([lat, lng]).addTo(map).bindPopup('📍 أنت هنا');
    }, function() {});

    db.collection("messages").get()
        .then(function(snapshot) {
            snapshot.forEach(function(doc) {
                var data = doc.data();
                if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
                    var marker = L.marker([data.latitude, data.longitude]).addTo(map);
                    var text = "<b>" + (data.username || 'مجهول') + "</b><br>" + data.message;
                    if (data.createdAt && data.createdAt.toDate) {
                        text += "<br><small>" + data.createdAt.toDate().toLocaleDateString() + "</small>";
                    }
                    marker.bindPopup(text);
                }
            });
        })
        .catch(function(err) { console.error('خطأ في تحميل الرسائل:', err); });
}
