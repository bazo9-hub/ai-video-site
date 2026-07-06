// ======================================================
// ===== دوال التفاعل (إعجابات، تعليقات، حذف) =====
// ======================================================

// ===== الإعجاب =====
window.toggleLike = function(docId) {
    console.log('تم الضغط على زر الإعجاب، docId:', docId);
    
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولاً");
        return;
    }
    
    var docRef = db.collection("messages").doc(docId);
    docRef.get().then(function(doc) {
        if (!doc.exists) {
            alert("الرسالة غير موجودة");
            return;
        }
        var data = doc.data();
        var likedBy = data.likedBy || [];
        var index = likedBy.indexOf(currentUser.uid);
        var newLikes = data.likes || 0;

        if (index > -1) {
            likedBy.splice(index, 1);
            newLikes--;
            console.log('تم إلغاء الإعجاب');
        } else {
            likedBy.push(currentUser.uid);
            newLikes++;
            console.log('تم الإعجاب');
        }

        docRef.update({
            likes: newLikes,
            likedBy: likedBy
        }).then(function() {
            loadMessages(); // تحديث الخريطة
        }).catch(function(err) {
            alert('❌ فشل الإعجاب: ' + err.message);
        });
    });
};

// ===== التعليق =====
window.addComment = function(docId) {
    console.log('تم الضغط على زر التعليق، docId:', docId);
    
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
        loadMessages(); // تحديث الخريطة
    }).catch(function(err) {
        alert('❌ فشل التعليق: ' + err.message);
    });
};

// ===== الحذف =====
window.deleteMessage = function(docId, authorUid) {
    console.log('تم الضغط على زر الحذف، docId:', docId);
    
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
