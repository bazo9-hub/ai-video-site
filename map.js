// ======================================================
// ===== أيقونات باستخدام L.icon (مضمونة الظهور) =====
// ======================================================

// أيقونة حمراء للرسائل
var redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// أيقونة زرقاء للموقع
var blueIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// ======================================================
// ===== دوال التفاعل (إعجابات، تعليقات، حذف) =====
// ======================================================

window.toggleLike = function(docId) {
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولاً");
        return;
    }
    var docRef = db.collection("messages").doc(docId);
    docRef.get().then(function(doc) {
        if (!doc.exists) return;
        var data = doc.data();
        var likedBy = data.likedBy || [];
        var index = likedBy.indexOf(currentUser.uid);
        var newLikes = data.likes || 0;

        if (index > -1) {
            likedBy.splice(index, 1);
            newLikes--;
        } else {
            likedBy.push(currentUser.uid);
            newLikes++;
        }

        docRef.update({
            likes: newLikes,
            likedBy: likedBy
        }).then(function() {
            loadMessages();
        }).catch(function(err) {
            alert('❌ فشل الإعجاب: ' + err.message);
        });
    });
};

window.addComment = function(docId) {
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولاً");
        return;
    }
    var commentText = prompt("💬 اكتب تعليقك:");
    if (!commentText) return;

    db.collection("messages").doc(docId).collection("comments").add({
        uid: currentUser.uid,
        username: currentUser.email || 'مجهول',
        text: commentText,
        createdAt: new Date()
    }).then(function() {
        alert('✅ تم إضافة التعليق!');
        loadMessages();
    }).catch(function(err) {
        alert('❌ فشل التعليق: ' + err.message);
    });
};

window.deleteMessage = function(docId, authorUid) {
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولاً");
        return;
    }
    if (currentUser.uid !== authorUid) {
        alert("ليس لديك صلاحية حذف هذه الرسالة");
        return;
    }
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;

    db.collection("messages").doc(docId).delete().then(function() {
        alert('🗑️ تم الحذف!');
        loadMessages();
    }).catch(function(err) {
        alert('❌ فشل الحذف: ' + err.message);
    });
};

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

    // ===== موقع المستخدم =====
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        L.marker([lat, lng], { icon: blueIcon }).addTo(map).bindPopup('📍 أنت هنا');
    }, function() {
        alert('لم نتمكن من جلب موقعك، لكنك تقدر تختار أي مكان.');
    });

    // ===== كتابة رسالة =====
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
            var marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
            marker.bindPopup("<b>" + (user.email || 'مجهول') + "</b><br>" + msg);
            loadMessages();
        })
        .catch(function(err) {
            alert('❌ فشل الحفظ: ' + err.message);
        });
    });

    loadMessages();
}

// ===== تحميل الرسائل =====
function loadMessages() {
    console.log("🔄 loadMessages تم استدعاؤها");

    // تنظيف العلامات القديمة
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

    // جلب الرسائل
    db.collection("messages").get()
        .then(function(snapshot) {
            console.log("✅ تم جلب الرسائل، عددها:", snapshot.size);
            
            if (snapshot.size === 0) {
                console.log("⚠️ لا توجد رسائل في قاعدة البيانات");
                return;
            }

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

                    var marker = L.marker([data.latitude, data.longitude], { icon: redIcon }).addTo(map);
                    if (marker._icon) marker._icon.classList.add('marker-animate');
                    marker.bindPopup(popupContent);
                    console.log("✅ تم إضافة دبوس أحمر في:", data.latitude, data.longitude);

                    // جلب التعليقات
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
            console.error("❌ خطأ في جلب الرسائل:", err);
        });
}
