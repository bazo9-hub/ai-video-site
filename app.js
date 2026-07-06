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
