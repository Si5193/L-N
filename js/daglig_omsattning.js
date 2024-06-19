import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getRedDays } from './red_days.js';
import { eachDayOfInterval, format, isSunday } from 'date-fns';

const omsattningForm = document.getElementById('omsattningForm');
const resetValuesButton = document.getElementById('resetValues');
const dailyDataTable = document.getElementById('dailyDataTable').getElementsByTagName('tbody')[0];

let currentUser = null;
let monthlySalary = 0;
let redDays = [];

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
    dailyDataTable.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.date).toLocaleDateString();
        const revenue = data.revenue ? data.revenue.toFixed(2) : '0.00';
        const isVacationDay = data.isVacationDay ? 'Ja' : 'Nej';
        const vacationValue = data.isVacationDay ? data.vacationValue.toFixed(2) : '';

        const row = dailyDataTable.insertRow();
        row.innerHTML = `
            <td>${date}</td>
            <td>${revenue} kr</td>
            <td>${isVacationDay}</td>
            <td>${vacationValue} kr</td>
        `;
    });
}

omsattningForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const revenue = parseFloat(document.getElementById('revenue').value) || 0;
    const isVacationDay = document.getElementById('isVacationDay').checked;
    const vacationValue = parseFloat(document.getElementById('vacationValue').value) || 0;

    const dailySalary = monthlySalary / 21;
    const month = new Date(date).getMonth() + 1;
    const year = new Date(date).getFullYear();
    const workingDays = getWorkingDays(year, month);
    const dailyThreshold = 7816;
    const monthlyThreshold = dailyThreshold * workingDays;

    let dailyProvision = 0;
    let totalSalary = 0;

    if (isVacationDay) {
        dailyProvision = 0;
        totalSalary = vacationValue;
    } else {
        const dailyRevenueThreshold = revenue > dailyThreshold ? revenue - dailyThreshold : 0;
        dailyProvision = dailyRevenueThreshold * 0.17;
        totalSalary = dailyProvision + dailySalary;
    }

    try {
        await addDoc(collection(db, 'revenues'), {
            uid: currentUser.uid,
            date: date,
            revenue: revenue,
            dailyProvision: dailyProvision,
            isVacationDay: isVacationDay,
            vacationValue: vacationValue,
            totalSalary: totalSalary,
            timestamp: serverTimestamp()
        });
        alert('Omsättning sparad!');
        omsattningForm.reset();
        fetchRevenues(currentUser.uid); // Uppdatera visningen av daglig data efter sparande
    } catch (error) {
        console.error('Error adding document: ', error);
    }
});

resetValuesButton.addEventListener('click', async () => {
    try {
        const q = query(collection(db, 'revenues'), where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        alert('Värden nollställda!');
        dailyDataTable.innerHTML = ''; // Töm visningen av daglig data efter nollställning
    } catch (error) {
        console.error('Error resetting values: ', error);
    }
});

function getWorkingDays(year, month) {
    let workingDays = 0;
    let totalDays = new Date(year, month, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
        let currentDate = new Date(year, month - 1, day);
        let currentDay = currentDate.getDay();
        let formattedDate = currentDate.toISOString().split('T')[0];

        if (currentDay !== 0 && currentDay !== 6 && !redDays.includes(formattedDate)) {
            workingDays++;
        }
    }

    return workingDays;
}
