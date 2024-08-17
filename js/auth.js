import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            console.error('Email eller password input-fält saknas.');
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            // Använd signInWithEmailAndPassword från firebase-auth-paketet
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Inloggning lyckades:', userCredential.user);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Fel vid inloggning:', error);
            alert('Inloggning misslyckades. Kontrollera dina uppgifter och försök igen.');
        }
    });
});
