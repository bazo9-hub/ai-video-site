// ===== مراقبة حالة المستخدم =====
auth.onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
        // إخفاء صفحة تسجيل الدخول وإظهار التطبيق
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("appBox").style.display = "block";
        
        // إظهار الخريطة وإخفاء الملف الشخصي
        document.getElementById("mapPage").style.display = "block";
        document.getElementById("profilePage").style.display = "none";
        
        // تحميل بيانات المستخدم
        loadUserProfile();
        
        // تشغيل الخريطة
        startMap(user);
    } else {
        // إظهار صفحة تسجيل الدخول وإخفاء التطبيق
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("appBox").style.display = "none";
        document.getElementById("mapPage").style.display = "none";
        document.getElementById("profilePage").style.display = "none";
    }
});
