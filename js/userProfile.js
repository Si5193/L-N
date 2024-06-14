import { auth } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const userProfile = document.getElementById('user-profile');
const usernameSpan = document.getElementById('username');
const logoutLink = document.getElementById('logout');

onAuthStateChanged(auth, (user) => {
    if (user) {
        const email = user.email;
        const username = email.substring(0, email.indexOf('@'));
        usernameSpan.textContent = username;
    } else {
        window.location.href = 'login.html';
    }
});

logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
});
