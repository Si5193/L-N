import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const historyTable = document.getElementById('historyTable').getElementsByTagName('tbody')[0];

let currentUser = null;
let monthlySalary = 0;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchMonthlySalary(user.uid).then(() => {
            setupRealtimeListeners(user.uid);
        });
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

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.date);
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const monthYear = `${month} ${year}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { revenue: 0, days: 0, totalProvision: 0, dailySalary: 0, totalSalary: 0 };
            }

            if (data.isSickDay) {
                monthlyData[monthYear].totalProvision += data.dailyProvision;
            } else {
                monthlyData[monthYear].revenue += data.revenue;
                monthlyData[monthYear].totalProvision += data.dailyProvision;
            }

            monthlyData[monthYear].days += 1;
        });

        updateHistoryTable(monthlyData);
    });
}

function updateHistoryTable(monthlyData) {
    historyTable.innerHTML = ''; // Töm tabellen innan vi lägger till ny data

    Object.keys(monthlyData).forEach(monthYear => {
        const data = monthlyData[monthYear];
        const dailySalary = monthlySalary / 21;
        const totalDailySalary = dailySalary * data.days;
        const totalSalary = data.totalProvision + totalDailySalary;

        const row = historyTable.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);
        const cell5 = row.insertCell(4);

        cell1.textContent = monthYear;
        cell2.textContent = `${data.revenue.toFixed(2)} kr`;
        cell3.textContent = `${data.totalProvision.toFixed(2)} kr`;
        cell4.textContent = `${totalDailySalary.toFixed(2)} kr`;
        cell5.textContent = `${totalSalary.toFixed(2)} kr`;
    });
}
