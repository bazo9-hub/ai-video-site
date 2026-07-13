// ======================================================
// ===== تعريف الأيقونات =====
// ======================================================
var redIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ff4757" stroke="white" stroke-width="1.5"/></svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [1, -30]
});

var blueIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#1e90ff" stroke="white" stroke-width="1.5"/></svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [1, -30]
});

// ======================================================
// ===== دوال التفاعل =====
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
            // نضيف الدبوس الجديد مباشرة
            var marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
            marker.bindPopup("<b>" + (user.email || 'مجهول') + "</b><br>" + msg);
            loadMessages(); // تحديث الخريطة
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

    // تنظيف العلامات القديمة (مع الحفاظ على طبقة الخريطة)
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
                console.log("📄 رسالة:", data.message, "الموقع:", data.latitude, data.longitude);

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
                } else {
                    console.warn("⚠️ إحداثيات غير صالحة:", data.latitude, data.longitude);
                }
            });
        })
        .catch(function(err) {
            console.error("❌ خطأ في جلب الرسائل:", err);
        });
}
