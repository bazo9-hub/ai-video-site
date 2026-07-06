window.signup = function() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(function() { document.getElementById("status").innerText = "✅ تم إنشاء الحساب"; })
        .catch(function(e) { alert(e.message); });
};

window.login = function() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    auth.signInWithEmailAndPassword(email, password)
        .then(function() { document.getElementById("status").innerText = "✅ تم تسجيل الدخول"; })
        .catch(function(e) { alert(e.message); });
};

window.logout = function() { auth.signOut(); };

window.showApp = function() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appBox').style.display = 'block';
};
