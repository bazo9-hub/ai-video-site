// ======================================================
// ===== دوال الملف الشخصي =====
// ======================================================

// ===== تحميل بيانات المستخدم =====
function loadUserProfile() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).get().then(function(doc) {
        if (doc.exists) {
            var data = doc.data();
            document.getElementById("profileUsername").value = data.username || '';
            document.getElementById("profileBio").value = data.bio || '';
            document.getElementById("profileAge").value = data.age || '';
            document.getElementById("profileLocation").value = data.location || '';
            document.getElementById("profileSocial").value = data.socialLinks || '';
            if (data.avatar) {
                document.getElementById("profileAvatar").src = data.avatar;
            }
        } else {
            document.getElementById("profileUsername").value = currentUser.email.split('@')[0] || 'مستخدم';
        }
    });
}

// ===== حفظ الملف الشخصي =====
window.saveProfile = function() {
    if (!currentUser) return;
    var username = document.getElementById("profileUsername").value.trim();
    if (!username) {
        alert("يرجى كتابة اسم المستخدم");
        return;
    }

    db.collection("users").doc(currentUser.uid).set({
        username: username,
        bio: document.getElementById("profileBio").value.trim(),
        age: document.getElementById("profileAge").value,
        location: document.getElementById("profileLocation").value.trim(),
        socialLinks: document.getElementById("profileSocial").value.trim(),
        avatar: document.getElementById("profileAvatar").src,
        email: currentUser.email,
        updatedAt: new Date()
    }, { merge: true }).then(function() {
        alert("✅ تم حفظ الملف الشخصي!");
        loadMessages();
    }).catch(function(err) {
        alert("❌ فشل الحفظ: " + err.message);
    });
};

// ===== إعادة تعيين الملف الشخصي =====
window.resetProfile = function() {
    if (!confirm("هل أنت متأكد من إعادة التعيين؟")) return;
    db.collection("users").doc(currentUser.uid).delete().then(function() {
        document.getElementById("profileUsername").value = '';
        document.getElementById("profileBio").value = '';
        document.getElementById("profileAge").value = '';
        document.getElementById("profileLocation").value = '';
        document.getElementById("profileSocial").value = '';
        document.getElementById("profileAvatar").src = 'https://ui-avatars.com/api/?name=مستخدم&background=4CAF50&color=fff&size=80';
        alert("🔄 تم إعادة التعيين");
    }).catch(function(err) {
        alert("❌ فشل: " + err.message);
    });
};

// ===== عرض الملف الشخصي (صفحة الحساب) =====
function loadProfile() {
    if (!currentUser) return;
    // عرض اسم المستخدم في العنوان
    db.collection("users").doc(currentUser.uid).get().then(function(doc) {
        if (doc.exists) {
            var data = doc.data();
            var username = data.username || currentUser.email.split('@')[0];
            document.querySelector('#profilePage h2').innerHTML = '👤 ' + username;
        }
    });

    // عرض رسائل المستخدم
    db.collection("messages").where("uid", "==", currentUser.uid).get()
        .then(function(snapshot) {
            var count = 0,
                totalLikes = 0,
                html = "";
            snapshot.forEach(function(doc) {
                var data = doc.data();
                count++;
                totalLikes += (data.likes || 0);
                html += '<div class="profile-item"><b>' + data.message + '</b><br><small>📍 ' +
                    data.latitude.toFixed(4) + ', ' + data.longitude.toFixed(4) +
                    '</small><br><small>❤️ ' + (data.likes || 0) + ' إعجاب</small></div>';
            });
            document.getElementById("profileCount").innerHTML = '<strong>عدد رسائلي:</strong> ' + count;
            document.getElementById("profileLikes").innerHTML = '<strong>❤️ إجمالي الإعجابات:</strong> ' + totalLikes;
            document.getElementById("profileMessages").innerHTML = html || "لا توجد رسائل بعد.";
        });
}
