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

    // Hantera autentiseringsstatus
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log("User authenticated:", user.uid);
            await fetchMonthlySalary(user.uid);
            fetchMonthlyRevenues(user.uid);
        } else {
            window.location.href = 'index.html';
        }
    });

    // Hämta användarens månadslön
    async function fetchMonthlySalary(uid) {
        try {
            const userDocRef = doc(db, "users", uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                monthlySalary = userDoc.data().monthlySalary;
                console.log("Monthly Salary:", monthlySalary);
            } else {
                console.error("User document not found.");
            }
        } catch (error) {
            console.error("Error fetching monthly salary:", error);
        }
    }

    // Hämta och bearbeta omsättningsdata per månad
    async function fetchMonthlyRevenues(uid) {
        try {
            const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
            const querySnapshot = await getDocs(q);

            console.log("Fetching monthly revenues...");

            historyContainer.innerHTML = '';
            const table = document.createElement('table');
            table.classList.add('history-table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Månad</th>
                        <th>Omsättning</th>
                        <th>Provision</th>
                        <th>Total lön inkl Provision</th>
                        <th>Antal sjuk-/semesterdagar</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            historyContainer.appendChild(table);

            let monthlyData = {};

            // Bearbeta varje dokument i resultatet
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Document data:", data);
                const date = new Date(data.date);
                const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                const revenue = data.revenue ? data.revenue : 0;
                const isSickOrVacation = data.isVacationDay || data.isSickDay;
                const provision = Math.max(0, (revenue - 7816) * 0.17);
                const dailySalary = monthlySalary / 21;

                if (!monthlyData[month]) {
                    monthlyData[month] = { totalRevenue: 0, totalProvision: 0, totalEarnings: 0, sickVacationDays: 0, workDays: 0 };
                }

                monthlyData[month].totalRevenue += revenue;
                monthlyData[month].totalProvision += provision;
                if (!isSickOrVacation) {
                    monthlyData[month].totalEarnings += dailySalary + provision;
                    monthlyData[month].workDays++;
                } else {
                    monthlyData[month].sickVacationDays++;
                }
            });

            // Visa data i tabellen
            for (const [month, data] of Object.entries(monthlyData)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${month}</td>
                    <td>${data.totalRevenue.toFixed(2)} kr</td>
                    <td>${data.totalProvision.toFixed(2)} kr</td>
                    <td>${data.totalEarnings.toFixed(2)} kr</td>
                    <td>${data.sickVacationDays} dagar</td>
                `;
                tbody.appendChild(row);
            }

        } catch (error) {
            console.error("Error fetching revenues:", error);
        }
    }
});
