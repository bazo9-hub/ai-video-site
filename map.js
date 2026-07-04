// ===== متغيرات الخريطة =====
var map, currentUser = null;

// ===== أيقونات SVG المدمجة (حل نهائي للنقاط السوداء) =====
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
    // إنشاء الخريطة (مرة واحدة فقط)
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

    // ===== موقع المستخدم (دبوس أزرق) =====
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        L.marker([lat, lng], {icon: blueIcon}).addTo(map).bindPopup('📍 أنت هنا');
    }, function() {
        alert('لم نتمكن من جلب موقعك، لكنك تقدر تختار أي مكان.');
    });

    // ===== الضغط على الخريطة لكتابة رسالة =====
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
                // ===== إضافة العلامة الجديدة فقط (بدون إعادة تحميل الخريطة) =====
                var marker = L.marker([lat, lng], {icon: redIcon}).addTo(map);
                marker.bindPopup("<b>" + (username || user.email) + "</b><br>" + msg);
                // هنا لا نستدعي loadMessages()، بل نضيف العلامة مباشرة
            })
            .catch(function(err) {
                alert('❌ فشل الحفظ: ' + err.message);
            });
        });
    });

    // ===== تحميل الرسائل القديمة =====
    loadMessages();
}

// ===== تحميل الرسائل وعرضها (بدون حذف الطبقات) =====
function loadMessages() {
    // ===== نضيف العلامات مباشرة، ولا نحذف أي شيء =====
    db.collection("messages").get()
        .then(function(snapshot) {
            snapshot.forEach(function(doc) {
                var data = doc.data();
                var docId = doc.id;
                if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
                    var likes = data.likes || 0;
                    var isOwner = (currentUser && currentUser.uid === data.uid);

                    var popupContent =
                        '<div class="popup-text">' +
                        '<b>' + (data.username || 'مجهول') + '</b><br>' +
                        data.message + '<br>' +
                        '<span class="likes-count">❤️ ' + likes + '</span>' +
                        ' <button class="action-btn like-btn" onclick="toggleLike(\'' + docId + '\')">👍</button>' +
                        ' <button class="action-btn comment-btn" onclick="addComment(\'' + docId + '\')">💬</button>' +
                        (isOwner ? ' <button class="action-btn delete-btn" onclick="deleteMessage(\'' + docId + '\', \'' + data.uid + '\')">🗑️</button>' : '') +
                        '<br><small>' + (data.createdAt?.toDate?.()?.toLocaleDateString('ar-EG') || '') + '</small>' +
                        '<hr style="margin:5px 0;">' +
                        '<div id="comments-' + docId + '" style="text-align:left;font-size:13px;max-height:100px;overflow-y:auto;"><i>⏳ جاري التحميل...</i></div>' +
                        '</div>';

                    var marker = L.marker([data.latitude, data.longitude], {icon: redIcon}).addTo(map);
                    if (marker._icon) marker._icon.classList.add('marker-animate');
                    marker.bindPopup(popupContent);

                    marker.on('popupopen', function() {
                        var container = document.getElementById('comments-' + docId);
                        if (container) {
                            container.innerHTML = '<i>⏳ جاري التحميل...</i>';
                            db.collection("messages").doc(docId).collection("comments")
                                .orderBy("createdAt", "desc").limit(5).get()
                                .then(function(commentSnap) {
                                    var html = "";
                                    if (commentSnap.empty) { html = '<i style="color:#888;">لا توجد تعليقات</i>'; } else {
                                        commentSnap.forEach(function(cDoc) {
                                            var cData = cDoc.data();
                                            html += '<div class="comment-box"><b>' + (cData.username || 'مجهول') + '</b>: ' + cData.text +
                                                ' <small style="color:#999;">' + (cData.createdAt?.toDate?.()?.toLocaleDateString('ar-EG') || '') + '</small></div>';
                                        });
                                    }
                                    container.innerHTML = html;
                                });
                        }
                    });
                }
            });
        })
        .catch(function(err) { console.error('خطأ في تحميل الرسائل:', err); });
}
