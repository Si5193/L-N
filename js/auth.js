import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('username').value; // Användarnamn fältet blir nu e-post
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Inloggning lyckades!');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Fel vid inloggning:', error);
        alert('Fel vid inloggning: ' + error.message);
    }
});
