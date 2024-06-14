import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const preliminarLonForm = document.getElementById('preliminar-lon-form');
const messageDiv = document.getElementById('message');

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        window.location.href = 'index.html';
    }
});

if (preliminarLonForm) {
    preliminarLonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const days = document.getElementById('days').value;
        const revenue = document.getElementById('revenue').value;

        if (!currentUser) {
            alert('Användare inte inloggad.');
            return;
        }

        try {
            const dailyRevenue = revenue / days;
            const dailyProvision = (dailyRevenue - 7816) * 0.17;
            const monthlyProvision = (dailyProvision * 30); // Justera till rätt antal dagar i månaden
            const preliminarLon = (7816 + dailyProvision) * 30; // Justera till rätt antal dagar i månaden

            messageDiv.innerHTML = `
                <p>Daglig omsättning: ${Math.round(dailyRevenue)} kr</p>
                <p>Daglig provision: ${Math.round(dailyProvision)} kr</p>
                <p>Månadsvis provision: ${Math.round(monthlyProvision)} kr</p>
                <p>Preliminär månadslön: ${Math.round(preliminarLon)} kr</p>
            `;
        } catch (error) {
            console.error('Fel vid beräkning:', error);
            messageDiv.textContent = 'Fel vid beräkning. Försök igen.';
        }
    });
}
