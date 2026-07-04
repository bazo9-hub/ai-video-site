
// ===== مراقبة حالة المستخدم =====
auth.onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("appBox").style.display = "block";
        startMap(user);
    } else {
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("appBox").style.display = "none";
    }
});
