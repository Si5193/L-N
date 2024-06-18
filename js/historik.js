import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, query, collection, where, getDocs, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const historyTable = document.getElementById('historyTable').getElementsByTagName('tbody')[0];

let currentUser = null;
let monthlySalary = 0;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("User logged in: ", user.uid);
        await fetchMonthlySalary(user.uid);
        console.log("Monthly Salary fetched: ", monthlySalary);
        setupRealtimeListeners(user.uid);
    } else {
        console.log("No user logged in");
        window.location.href = 'index.html';
    }
});

async function fetchMonthlySalary(uid) {
    try {
        console.log("Fetching monthly salary for UID: ", uid);
        const userDocRef = doc(db, "Users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            monthlySalary = userDoc.data().monthlySalary;
            console.log("Monthly Salary for user: ", monthlySalary);
        } else {
            console.error("No user document found for UID: ", uid);
        }
    } catch (error) {
        console.error("Error fetching monthly salary: ", error);
    }
}

function setupRealtimeListeners(uid) {
    const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
    onSnapshot(q, (querySnapshot) => {
        let monthlyData = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Revenue data: ", data);
            const date = new Date(data.date);
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const monthYear = `${month} ${year}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { revenue: 0, days: 0, totalProvision: 0 };
            }

            if (data.isSickDay) {
                monthlyData[monthYear].totalProvision += data.dailyProvision || 0;
            } else {
                monthlyData[monthYear].revenue += data.revenue || 0;
                monthlyData[monthYear].totalProvision += ((data.revenue - 7816) * 0.17) || 0;
            }

            monthlyData[monthYear].days += 1;
        });

        console.log("Monthly Data: ", monthlyData);
        updateHistoryTable(monthlyData);
    });
}

function updateHistoryTable(monthlyData) {
    historyTable.innerHTML = ''; // Töm tabellen innan vi lägger till ny data

    Object.keys(monthlyData).forEach(monthYear => {
        const data = monthlyData[monthYear];
        const dailySalary = monthlySalary / 21 || 0;
        const totalMonthlySalary = dailySalary * data.days || 0;
        const totalSalary = data.totalProvision + totalMonthlySalary || 0;

        console.log("Data for month: ", monthYear, data);
        console.log("Daily Salary: ", dailySalary);
        console.log("Total Monthly Salary: ", totalMonthlySalary);
        console.log("Total Salary: ", totalSalary);

        const row = historyTable.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);
        const cell5 = row.insertCell(4);

        cell1.textContent = monthYear;
        cell2.textContent = `${data.revenue.toFixed(2)} kr`;
        cell3.textContent = `${data.totalProvision.toFixed(2)} kr`;
        cell4.textContent = `${totalMonthlySalary.toFixed(2)} kr`;
        cell5.textContent = `${totalSalary.toFixed(2)} kr`;
    });
}
