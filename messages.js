// ===== تحميل الرسائل =====
function loadMessages() {
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

// ===== دوال التفاعل =====
window.toggleLike = function(docId) {
    if (!currentUser) { alert("يجب تسجيل الدخول"); return; }
    var docRef = db.collection("messages").doc(docId);
    docRef.get().then(function(doc) {
        if (!doc.exists) return;
        var data = doc.data();
        var likedBy = data.likedBy || [];
        var index = likedBy.indexOf(currentUser.uid);
        var newLikes = data.likes || 0;
        if (index > -1) { likedBy.splice(index, 1); newLikes--; } else { likedBy.push(currentUser.uid); newLikes++; }
        docRef.update({ likes: newLikes, likedBy: likedBy }).then(function() { loadMessages(); });
    });
};

window.deleteMessage = function(docId, authorUid) {
    if (!currentUser) return;
    if (currentUser.uid !== authorUid) { alert("ليس لديك صلاحية"); return; }
    if (!confirm("هل أنت متأكد؟")) return;
    db.collection("messages").doc(docId).delete().then(function() { loadMessages(); });
};

window.addComment = function(docId) {
    if (!currentUser) { alert("يجب تسجيل الدخول"); return; }
    var commentText = prompt("💬 اكتب تعليقك:");
    if (!commentText) return;
    getUsername(function(username) {
        db.collection("messages").doc(docId).collection("comments").add({
            uid: currentUser.uid,
            username: username || 'مجهول',
            text: commentText,
            createdAt: new Date()
        }).then(function() { loadMessages(); });
    });
};

// ===== دالة مساعدة لجلب اسم المستخدم =====
function getUsername(callback) {
    if (!currentUser) { callback('مجهول'); return; }
    db.collection("users").doc(currentUser.uid).get().then(function(doc) {
        if (doc.exists && doc.data().username) { callback(doc.data().username); } 
        else { callback(currentUser.email.split('@')[0]); }
    });
}
