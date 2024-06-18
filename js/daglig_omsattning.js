import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Säkerställ att orderBy importeras korrekt
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const omsattningForm = document.getElementById('omsattningForm');
const resetValuesButton = document.getElementById('resetValues');
const dailyDataContainer = document.getElementById('dailyDataContainer');

let currentUser = null;
let monthlySalary = 0;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchMonthlySalary(user.uid);
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
    dailyDataContainer.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.date).toLocaleDateString();
        const revenue = data.revenue.toFixed(2);
        const dailyProvision = data.dailyProvision.toFixed(2);
        const totalSalary = data.totalSalary.toFixed(2);
        const isVacationDay = data.isVacationDay ? 'Ja' : 'Nej';
        const vacationValue = data.isVacationDay ? data.vacationValue.toFixed(2) : '';

        const dayData = document.createElement('div');
        dayData.classList.add('day-data');
        dayData.innerHTML = `
            <p>Datum: ${date}</p>
            <p>Omsättning: ${revenue} kr</p>
            <p>Daglig Provision: ${dailyProvision} kr</p>
            <p>Totallön: ${totalSalary} kr</p>
            <p>Semesterdag: ${isVacationDay}</p>
            ${isVacationDay === 'Ja' ? `<p>Värde för semesterdag: ${vacationValue} kr</p>` : ''}
        `;
        dailyDataContainer.appendChild(dayData);
    });
}

omsattningForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const revenue = parseFloat(document.getElementById('revenue').value) || 0;
    const isVacationDay = document.getElementById('isVacationDay').checked;
    const vacationValue = parseFloat(document.getElementById('vacationValue').value) || 0;
    const dailySalary = monthlySalary / 21;

    let dailyProvision = 0;
    let totalSalary = 0;

    if (isVacationDay) {
        dailyProvision = 0;
        totalSalary = vacationValue;
    } else {
        dailyProvision = (revenue - 7816) * 0.17 + dailySalary;
        totalSalary = dailyProvision;
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
        dailyDataContainer.innerHTML = ''; // Töm visningen av daglig data efter nollställning
    } catch (error) {
        console.error('Error resetting values: ', error);
    }
});
