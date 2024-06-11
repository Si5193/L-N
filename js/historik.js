import { db } from './firebaseConfig.js';
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const historikList = document.getElementById('historik-list');

// Funktion för att hämta och visa historisk data
async function fetchHistorik() {
    historikList.innerHTML = ''; // Töm listan först
    const q = query(collection(db, "revenues"), orderBy("date"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const listItem = document.createElement('tr');
        listItem.innerHTML = `
            <td>${data.date}</td>
            <td>${data.revenue} kr</td>
            <td>${data.provision ? data.provision + ' kr' : 'Ingen provision'}</td>
        `;
        historikList.appendChild(listItem);
    });
}

// Hämta data när sidan laddas
window.addEventListener('load', fetchHistorik);
