import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const historyTable = document.getElementById('historyTable').getElementsByTagName('tbody')[0];

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchHistoricalData(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

async function fetchHistoricalData(uid) {
    if (!uid) return;
    
    const omsattningRef = collection(db, "revenues");
    const q = query(omsattningRef, where("uid", "==", uid), orderBy("date"));
    const querySnapshot = await getDocs(q);

    let monthlyData = {};

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
    });

    const monthlySalaryDoc = await getDocs(query(collection(db, "monthly_salaries"), where("uid", "==", uid)));

    let monthlySalary = 0;
    if (!monthlySalaryDoc.empty) {
        monthlySalaryDoc.forEach((doc) => {
            monthlySalary = doc.data().salary;
        });
    }

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
}
