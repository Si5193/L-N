import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, orderBy, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const expectedSalaryElement = document.getElementById('expected-salary');
const revenueChartCtx = document.getElementById('revenueChart').getContext('2d');
const monthlySalaryInput = document.getElementById('monthly-salary');
const saveSalaryButton = document.getElementById('save-salary');
const salaryInputContainer = document.getElementById('salary-input-container');

let currentUser = null;
let revenueChart = null;
let monthlySalary = 0;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadMonthlySalary(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

saveSalaryButton.addEventListener('click', () => {
    if (!currentUser) return;
    monthlySalary = parseFloat(monthlySalaryInput.value);
    saveMonthlySalary(currentUser.uid, monthlySalary);
});

async function saveMonthlySalary(uid, salary) {
    try {
        await setDoc(doc(db, "users", uid), { monthlySalary: salary }, { merge: true });
        alert('Månadslön sparad!');
        salaryInputContainer.style.display = 'none';
        fetchRevenues(uid);
    } catch (error) {
        console.error('Fel vid sparande av månadslön:', error);
        alert('Fel vid sparande av månadslön. Försök igen.');
    }
}

async function loadMonthlySalary(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        monthlySalary = docSnap.data().monthlySalary;
        if (monthlySalary) {
            monthlySalaryInput.value = monthlySalary;
            salaryInputContainer.style.display = 'none';
            fetchRevenues(uid);
        } else {
            salaryInputContainer.style.display = 'block';
        }
    } else {
        salaryInputContainer.style.display = 'block';
    }
}

async function fetchRevenues(uid) {
    if (!uid) return;
    const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
    const querySnapshot = await getDocs(q);
    const revenues = [];
    const dates = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        revenues.push(data.revenue);
        dates.push(data.date);
    });

    calculateExpectedSalary(revenues, dates);
}

function calculateExpectedSalary(revenues = [], dates = []) {
    if (!monthlySalary) return;

    const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue, 0);
    const daysWorked = revenues.length;
    const dailyRevenue = totalRevenue / daysWorked;
    const dailyProvision = (dailyRevenue - 7816) * 0.17;
    const dailySalary = monthlySalary / 21;
    const totalDailyEarnings = dailySalary + dailyProvision;
    const expectedSalary = totalDailyEarnings * 30;

    expectedSalaryElement.textContent = `${Math.round(expectedSalary)} kr`;

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(revenueChartCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daglig Omsättning',
                data: revenues,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Omsättning (kr)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}
