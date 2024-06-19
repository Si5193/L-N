import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const preliminarLonContainer = document.getElementById('preliminarLonContainer');
const monthlySalaryInput = document.getElementById('monthlySalaryInput');
const saveSalaryButton = document.getElementById('saveSalaryButton');
const calculateButton = document.getElementById('calculateButton');
const resultContainer = document.getElementById('resultContainer');

let currentUser = null;
let monthlySalary = 0;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await fetchMonthlySalary(user.uid);
        fetchPreliminarLon(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

async function fetchMonthlySalary(uid) {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        monthlySalary = userDoc.data().monthlySalary;
        monthlySalaryInput.value = monthlySalary;
    }
}

async function fetchPreliminarLon(uid) {
    const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
    const querySnapshot = await getDocs(q);
    let totalRevenue = 0;
    let totalProvision = 0;
    let totalDays = 0;
    let totalVacationValue = 0;

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const revenue = data.revenue ? data.revenue : 0;
        const dailyProvision = data.dailyProvision ? data.dailyProvision : 0;
        const isVacationDay = data.isVacationDay ? true : false;
        const vacationValue = data.vacationValue ? data.vacationValue : 0;

        totalRevenue += parseFloat(revenue);
        totalProvision += parseFloat(dailyProvision);
        totalVacationValue += parseFloat(vacationValue);
        if (!isVacationDay) {
            totalDays++;
        }
    });

    const dailySalary = monthlySalary / 21;
    const totalMonthlySalary = dailySalary * totalDays;
    const totalIncome = totalProvision + totalMonthlySalary + totalVacationValue;

    resultContainer.innerHTML = `
        <p>Total Omsättning: ${totalRevenue.toFixed(2)} kr</p>
        <p>Total Provision: ${totalProvision.toFixed(2)} kr</p>
        <p>Total Månadslön: ${totalMonthlySalary.toFixed(2)} kr</p>
        <p>Total Semestervärde: ${totalVacationValue.toFixed(2)} kr</p>
        <p>Förväntad Total Lön inkl Provision: ${totalIncome.toFixed(2)} kr</p>
    `;
}

saveSalaryButton.addEventListener('click', async () => {
    const newSalary = parseFloat(monthlySalaryInput.value);
    if (isNaN(newSalary) || newSalary <= 0) {
        alert('Ange en giltig månadslön.');
        return;
    }
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
        await setDoc(userDocRef, { monthlySalary: newSalary }, { merge: true });
        alert('Månadslön sparad!');
        monthlySalary = newSalary;
    } catch (error) {
        console.error('Fel vid sparande av månadslön:', error);
    }
});

calculateButton.addEventListener('click', () => {
    fetchPreliminarLon(currentUser.uid);
});
