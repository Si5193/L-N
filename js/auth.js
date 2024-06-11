import { auth } from './firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Registrera ny användare
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Registrering lyckades
                alert('Registrering lyckades!');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                // Hantera fel
                console.error('Fel vid registrering:', error.message);
                alert('Fel vid registrering: ' + error.message);
            });
    });
}

// Logga in användare
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Inloggning lyckades
                alert('Inloggning lyckades!');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                // Hantera fel
                console.error('Fel vid inloggning:', error.message);
                alert('Fel vid inloggning: ' + error.message);
            });
    });
}

