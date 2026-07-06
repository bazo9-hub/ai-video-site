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

    // ===== موقع المستخدم (دبوس أزرق) =====
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        L.marker([lat, lng], { icon: blueIcon }).addTo(map).bindPopup('📍 أنت هنا');
    }, function() {
        alert('لم نتمكن من جلب موقعك، لكنك تقدر تختار أي مكان.');
    });

    // ===== الضغط على الخريطة لكتابة رسالة =====
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

    loadMessages();
}

function loadMessages() {
    // تنظيف الخريطة من العلامات القديمة
    map.eachLayer(function(layer) {
        if (!!layer.getPopup || !!layer._popup) {
            map.removeLayer(layer);
        }
    });

    // إعادة طبقة الخريطة
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        noWrap: true,
        minZoom: 1,
        maxZoom: 18
    }).addTo(map);

    // إعادة علامة موقع المستخدم
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        L.marker([lat, lng], { icon: blueIcon }).addTo(map).bindPopup('📍 أنت هنا');
    }, function() {});

    // جلب الرسائل وعرضها مع الأزرار
    db.collection("messages").get()
        .then(function(snapshot) {
            snapshot.forEach(function(doc) {
                var data = doc.data();
                var docId = doc.id;
                if (data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
                    var likes = data.likes || 0;
                    var isOwner = (currentUser && currentUser.uid === data.uid);

                    // ===== بناء النافذة المنبثقة بالأزرار =====
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

                    var marker = L.marker([data.latitude, data.longitude], { icon: redIcon }).addTo(map);
                    if (marker._icon) marker._icon.classList.add('marker-animate');
                    marker.bindPopup(popupContent);

                    // جلب التعليقات عند فتح النافذة
                    marker.on('popupopen', function() {
                        var container = document.getElementById('comments-' + docId);
                        if (container) {
                            container.innerHTML = '<i>⏳ جاري التحميل...</i>';
                            db.collection("messages").doc(docId).collection("comments")
                                .orderBy("createdAt", "desc").limit(5).get()
                                .then(function(commentSnap) {
                                    var html = "";
                                    if (commentSnap.empty) {
                                        html = '<i style="color:#888;">لا توجد تعليقات</i>';
                                    } else {
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
        .catch(function(err) {
            console.error('خطأ في تحميل الرسائل:', err);
        });
}
