// ======================================================
// ===== دوال الواجهة (الوضع الليلي، التنقل) =====
// ======================================================

// ===== التنقل بين الخريطة والملف الشخصي =====
window.goToMap = function() {
    document.getElementById("mapPage").style.display = "block";
    document.getElementById("profilePage").style.display = "none";
    if (map) map.invalidateSize();
};

window.showProfile = function() {
    document.getElementById("mapPage").style.display = "none";
    document.getElementById("profilePage").style.display = "block";
    loadProfile(); // تحميل بيانات الملف الشخصي
};

// ===== الوضع الليلي =====
window.toggleTheme = function() {
    document.body.classList.toggle('light');
    var btn = document.getElementById('themeBtn');
    if (document.body.classList.contains('light')) {
        btn.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        btn.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
};

// تطبيق الوضع المحفوظ عند تحميل الصفحة
(function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light');
        document.getElementById('themeBtn').textContent = '☀️';
    }
})();
