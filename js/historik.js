import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const historyContainer = document.getElementById('historyContainer');
    
    if (!historyContainer) {
        console.error("historyContainer element is not found.");
        return;
    }

    let currentUser = null;
    let monthlySalary = 0;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await fetchMonthlySalary(user.uid);
            fetchRevenues(user.uid);
        } else {
            window.location.href = 'index.html';
        }
    });

    async function fetchMonthlySalary(uid) {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            monthlySalary = userDoc.data().monthlySalary;
        }
    }

    async function fetchRevenues(uid) {
        const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
        const querySnapshot = await getDocs(q);

        historyContainer.innerHTML = '';
        const table = document.createElement('table');
        table.classList.add('history-table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Omsättning</th>
                    <th>Provision</th>
                    <th>Dagslön</th>
                    <th>Total Lön inkl Provision</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        historyContainer.appendChild(table);

        let totalRevenue = 0;
        let totalProvision = 0;
        let totalDays = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.date).toLocaleDateString();
            const revenue = data.revenue ? data.revenue.toFixed(2) : '0.00';
            const provision = (data.revenue - 7816) * 0.17;
            const dailySalary = monthlySalary / 21;
            const totalDayEarnings = provision + dailySalary;

            totalRevenue += parseFloat(revenue);
            totalProvision += parseFloat(provision);
            totalDays++;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${revenue} kr</td>
                <td>${provision.toFixed(2)} kr</td>
                <td>${dailySalary.toFixed(2)} kr</td>
                <td>${totalDayEarnings.toFixed(2)} kr</td>
            `;
            tbody.appendChild(row);
        });

        const totalMonthlySalary = (monthlySalary / 21) * totalDays;
        const totalIncome = totalProvision + totalMonthlySalary;

        const summaryRow = document.createElement('tr');
        summaryRow.innerHTML = `
            <td><strong>Total</strong></td>
            <td>${totalRevenue.toFixed(2)} kr</td>
            <td>${totalProvision.toFixed(2)} kr</td>
            <td>${totalMonthlySalary.toFixed(2)} kr</td>
            <td>${totalIncome.toFixed(2)} kr</td>
        `;
        tbody.appendChild(summaryRow);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                console.log('Noder har lagts till eller tagits bort.');
            }
        });
    });

    observer.observe(historyContainer, { childList: true });
});
