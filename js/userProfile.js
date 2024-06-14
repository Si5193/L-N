import { auth } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const userProfile = document.getElementById('user-profile');
const logoutLink = document.getElementById('logout');

onAuthStateChanged(auth, (user) => {
    if (user) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.email;  // Visa användarens email som namn
        }
    } else {
        window.location.href = 'index.html';
    }
});

if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });
}
