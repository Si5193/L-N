import { auth } from './firebaseConfig.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        // Skapa en giltig e-postadress från användarnamnet
        const email = `${username}@example.com`;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Registrering lyckades! Du kommer nu att omdirigeras till inloggningssidan.');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Fel vid registrering:', error);
            alert(`Fel vid registrering: ${error.message}`);
        }
    });
}
