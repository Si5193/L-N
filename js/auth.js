import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Logga in användare
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const email = `${username}@example.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            alert('Inloggning lyckades!');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Fel vid inloggning:', error.message);
            alert('Fel vid inloggning: ' + error.message);
        }
    });
}
