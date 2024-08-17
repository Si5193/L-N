import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const registerForm = document.getElementById('register-form');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('register-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Spara endast e-post i Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            monthlySalary: 0  // Initial value
        });

        alert('Registrering lyckades!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Fel vid registrering:', error);
        alert('Fel vid registrering: ' + error.message);
    }
});
