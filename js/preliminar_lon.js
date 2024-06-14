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
        if (salaryInputContainer) {
            salaryInputContainer.style.display = 'none';
        }
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
            if (salaryInputContainer) {
                salaryInputContainer.style.display = 'none';
            }
            fetchRevenues(uid);
        } else {
            if (salaryInputContainer) {
                salaryInputContainer.style.display = 'block';
            }
        }
    } else {
        if (salaryInputContainer) {
            salaryInputContainer.style.display = 'block';
        }
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

function getNumberOfDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

function getWorkdaysInMonth(month, year, redDays) {
    let workdays = 0;
    for (let day = 1; day <= getNumberOfDaysInMonth(month, year); day++) {
        const currentDate = new Date(year, month, day);
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        const isRedDay = redDays.some(redDay => {
            const redDate = new Date(redDay);
            return redDate.getDate() === currentDate.getDate() && redDate.getMonth() === currentDate.getMonth();
        });
        if (!isWeekend && !isRedDay) {
            workdays++;
        }
    }
    return workdays;
}

function calculateExpectedSalary(revenues = [], dates = []) {
    if (!monthlySalary) return;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Definiera röda dagar här, exempel:
    const redDays = [
        `${year}-01-01`, // Nyårsdagen
        `${year}-12-25`, // Juldagen
        // Lägg till fler röda dagar här
    ];

    const workdaysInMonth = getWorkdaysInMonth(month, year, redDays);
    
    const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue, 0);
    const daysWorked = revenues.length;
    const dailyRevenue = totalRevenue / daysWorked;
    const dailyProvision = (dailyRevenue - 7816) * 0.17;
    const dailySalary = monthlySalary / 21;
    const totalDailyEarnings = dailySalary + dailyProvision;
    const expectedSalary = totalDailyEarnings * workdaysInMonth;

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
