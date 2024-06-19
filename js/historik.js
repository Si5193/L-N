import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getRedDays } from './red_days.js';
import { eachDayOfInterval, format, isSunday } from 'date-fns';

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
            const currentYear = new Date().getFullYear();
            redDays = getRedDays(currentYear);
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
                    <th>Månad</th>
                    <th>Omsättning</th>
                    <th>Provision</th>
                    <th>Total lön inkl Provision/Semester</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        historyContainer.appendChild(table);

        let monthlyData = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.date);
            const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const revenue = data.revenue ? data.revenue : 0;
            const workingDays = getWorkingDays(date.getFullYear(), date.getMonth() + 1);
            const monthlyThreshold = 7816 * workingDays;
            const provision = (revenue - monthlyThreshold) > 0 ? (revenue - monthlyThreshold) * 0.17 : 0;
            const dailySalary = monthlySalary / 21;
            const totalDayEarnings = provision + dailySalary;

            if (!monthlyData[month]) {
                monthlyData[month] = { totalRevenue: 0, totalProvision: 0, totalEarnings: 0 };
            }

            monthlyData[month].totalRevenue += parseFloat(revenue);
            monthlyData[month].totalProvision += parseFloat(provision);
            monthlyData[month].totalEarnings += totalDayEarnings;
        });

        for (const [month, data] of Object.entries(monthlyData)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${month}</td>
                <td>${data.totalRevenue.toFixed(2)} kr</td>
                <td>${data.totalProvision.toFixed(2)} kr</td>
                <td>${data.totalEarnings.toFixed(2)} kr</td>
            `;
            tbody.appendChild(row);
        }

        const totalMonthlySalary = Object.values(monthlyData).reduce((acc, data) => acc + (monthlySalary / 21 * data.totalEarnings), 0);
        const totalIncome = Object.values(monthlyData).reduce((acc, data) => acc + data.totalEarnings, 0);

        const summaryRow = document.createElement('tr');
        summaryRow.innerHTML = `
            <td><strong>Total</strong></td>
            <td>${Object.values(monthlyData).reduce((acc, data) => acc + data.totalRevenue, 0).toFixed(2)} kr</td>
            <td>${Object.values(monthlyData).reduce((acc, data) => acc + data
