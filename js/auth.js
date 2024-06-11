import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Registrera ny användare
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const email = `${username}@example.com`;

        try {
            console.log('Försöker registrera med e-post:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Spara användarnamnet i Firestore
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email
            });

            console.log('Registrering lyckades:', user);
            alert('Registrering lyckades!');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Fel vid registrering:', error.message);
            alert('Fel vid registrering: ' + error.message);
        }
    });
}

// Logga in användare
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const email = `${username}@example.com`;

        try {
            console.log('Försöker logga in med e-post:', email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Inloggning lyckades:', userCredential);
            alert('Inloggning lyckades!');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Fel vid inloggning:', error.message);
            alert('Fel vid inloggning: ' + error.message);
        }
    });
}
