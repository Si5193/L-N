import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const historyTable = document.getElementById('historyTable').getElementsByTagName('tbody')[0];

let currentUser = null;
let monthlySalary = 0;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchMonthlySalary(user.uid);
        setupRealtimeListeners(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

async function fetchMonthlySalary(uid) {
    const monthlySalaryDoc = await getDocs(query(collection(db, "monthly_salaries"), where("uid", "==", uid)));
    if (!monthlySalaryDoc.empty) {
        monthlySalaryDoc.forEach((doc) => {
            monthlySalary = doc.data().salary;
        });
    }
}

function setupRealtimeListeners(uid) {
    const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
    onSnapshot(q, (querySnapshot) => {
        let monthlyData = {};
        let totalRevenue = 0;
        let totalSalary = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.date);
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const monthYear = `${month} ${year}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { revenue: 0, days: 0 };
            }

            monthlyData[monthYear].revenue += data.revenue;
            monthlyData[monthYear].days += 1;

            const provision = (data.revenue - 7816) * 0.17;
            const dailySalary = monthlySalary / 21;
            const totalDailySalary = provision + dailySalary;

            totalRevenue += data.revenue;
            totalSalary += totalDailySalary;
        });

        historyTable.innerHTML = ''; // Töm tabellen innan vi lägger till ny data

        Object.keys(monthlyData).forEach(monthYear => {
            const data = monthlyData[monthYear];
            const provision = (data.revenue - (7816 * data.days)) * 0.17;
            const dailySalary = monthlySalary / 21;
            const totalSalary = provision + (dailySalary * data.days);

            const row = historyTable.insertRow();
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            const cell3 = row.insertCell(2);

            cell1.textContent = monthYear;
            cell2.textContent = `${data.revenue.toFixed(2)} kr`;
            cell3.textContent = `${totalSalary.toFixed(2)} kr`;
        });
    });
}
