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

(function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light');
        document.getElementById('themeBtn').textContent = '☀️';
    }
})();
