import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            await signInWithEmailAndPassword(auth, username, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Fel vid inloggning:', error);
            alert('Fel vid inloggning. Kontrollera dina uppgifter och försök igen.');
        }
    });
}
