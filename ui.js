// ===== التنقل بين الواجهة والتطبيق =====
window.showApp = function() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appBox').style.display = 'block';
};

window.goToMap = function() {
    document.getElementById("mapPage").style.display = "block";
    document.getElementById("profilePage").style.display = "none";
    if (map) map.invalidateSize();
};

window.showProfile = function() {
    document.getElementById("mapPage").style.display = "none";
    document.getElementById("profilePage").style.display = "block";
    loadProfile();
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

// تطبيق الوضع المحفوظ
(function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light');
        document.getElementById('themeBtn').textContent = '☀️';
    }
})();

// ===== مراقبة المستخدم =====
auth.onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("mapPage").style.display = "block";
        document.getElementById("profilePage").style.display = "none";
        loadUserProfile();
        startMap(user);
    } else {
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("mapPage").style.display = "none";
        document.getElementById("profilePage").style.display = "none";
    }
});
