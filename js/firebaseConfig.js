import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
