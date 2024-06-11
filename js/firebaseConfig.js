
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0M-i21bF1HnjThFqacN9FJ8pUageNmP4",
    authDomain: "provsion1.firebaseapp.com",
    projectId: "provsion1",
    storageBucket: "provsion1.appspot.com",
    messagingSenderId: "654596923762",
    appId: "1:654596923762:web:c2997f482c8e2bdaa2fdeb",
    measurementId: "G-W2REDG7RRC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
