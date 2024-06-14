import { db } from './firebaseConfig.js';
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const historikList = document.getElementById('historik-list');

// Funktion för att hämta och visa historisk data
async function fetchHistorik() {
    historikList.innerHTML = ''; // Töm listan först
    const q = query(collection(db, "revenues"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const monthlyData = {};

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthYear = `${year}-${month}`;

        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { revenue: 0, provision: 0 };
        }

        monthlyData[monthYear].revenue += data.revenue;
        if (data.provision) {
            monthlyData[monthYear].provision += data.provision;
        }
    });

    for (const [key, value] of Object.entries(monthlyData)) {
        const [year, month] = key.split('-');
        const listItem = document.createElement('tr');
        listItem.innerHTML = `
            <td>${monthNames[month]} ${year}</td>
            <td>${value.revenue} kr</td>
            <td>${value.provision ? value.provision + ' kr' : 'Ingen provision'}</td>
        `;
        historikList.appendChild(listItem);
    }
}

// Hämta data när sidan laddas
window.addEventListener('load', fetchHistorik);
