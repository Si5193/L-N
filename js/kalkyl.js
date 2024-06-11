import { db } from './firebaseConfig.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const kalkylForm = document.getElementById('kalkyl-form');
const messageDiv = document.getElementById('message');

if (kalkylForm) {
    kalkylForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('date').value;
        const revenue = document.getElementById('revenue').value;

        try {
            const docRef = await addDoc(collection(db, "revenues"), {
                date: date,
                revenue: parseFloat(revenue)
            });
            messageDiv.textContent = 'Data sparad!';
            kalkylForm.reset();
        } catch (error) {
            console.error('Fel vid sparande:', error);
            messageDiv.textContent = 'Fel vid sparande. Försök igen.';
        }
    });
}
