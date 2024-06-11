import { db } from './firebaseConfig.js';
import { collection, addDoc, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const kalkylForm = document.getElementById('kalkyl-form');
const messageDiv = document.getElementById('message');
const revenueList = document.getElementById('revenue-list');

// Funktion för att hämta och visa omsättningsdata
async function fetchRevenues() {
    revenueList.innerHTML = ''; // Töm listan först
    const q = query(collection(db, "revenues"), orderBy("date"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const listItem = document.createElement('li');
        listItem.textContent = `${data.date}: ${data.revenue} kr`;
        revenueList.appendChild(listItem);
    });
}

// Event listener för att hantera formulärskickning
if (kalkylForm) {
    kalkylForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('date').value;
        const revenue = document.getElementById('revenue').value;

        try {
            await addDoc(collection(db, "revenues"), {
                date: date,
                revenue: parseFloat(revenue)
            });
            messageDiv.textContent = 'Data sparad!';
            kalkylForm.reset();
            fetchRevenues(); // Hämta och visa uppdaterad lista
        } catch (error) {
            console.error('Fel vid sparande:', error);
            messageDiv.textContent = 'Fel vid sparande. Försök igen.';
        }
    });

    // Hämta data när sidan laddas
    window.addEventListener('load', fetchRevenues);
}
