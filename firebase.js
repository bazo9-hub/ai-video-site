// ===== إعدادات Firebase =====
var firebaseConfig = {
    apiKey: "AIzaSyBS70yDWhJy0Dyga40Uhi4L1m_4017Fe6c",
    authDomain: "bazo-a36fe.firebaseapp.com",
    databaseURL: "https://bazo-a36fe-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bazo-a36fe",
    storageBucket: "bazo-a36fe.firebasestorage.app",
    messagingSenderId: "91348188690",
    appId: "1:91348188690:web:32769b1826e9aa0b8f22cb",
    measurementId: "G-ES9JXGH44V"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// متغيرات عامة
var auth = firebase.auth();
var db = firebase.firestore();
var map, currentUser = null;
