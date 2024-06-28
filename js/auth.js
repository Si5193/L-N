import { auth, db } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert('Felaktigt användarnamn eller lösenord.');
            return;
        }

        let email = '';
        querySnapshot.forEach((doc) => {
            email = doc.data().email;
        });

        await signInWithEmailAndPassword(auth, email, password);
        alert('Inloggning lyckades!');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Fel vid inloggning:', error);
        alert('Fel vid inloggning: ' + error.message);
    }
});
