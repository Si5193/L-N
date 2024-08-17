import { auth, db } from './firebaseConfig.js';
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const saveSalaryButton = document.getElementById('save-salary');
    const resetSalaryButton = document.getElementById('resetSalary');
    const monthlySalaryInput = document.getElementById('monthly-salary');
    const salaryInputContainer = document.getElementById('salary-input-container');
    const expectedSalaryDisplay = document.getElementById('expected-salary');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const monthlyAverageChartCtx = document.getElementById('monthlyAverageChart').getContext('2d');
    const overallAverageChartCtx = document.getElementById('overallAverageChart').getContext('2d');

    if (!saveSalaryButton || !resetSalaryButton || !monthlySalaryInput || !expectedSalaryDisplay || !salaryInputContainer) {
        console.error('Ett eller flera av de förväntade elementen kunde inte hittas.');
        return;
    }

    let monthlySalaries = [];
    let currentUser = null;

    // Vänta på att användarens autentiseringsstatus ändras
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Användaren är inloggad
            console.log('Användare är inloggad:', user);

            // Visa laddningsindikator medan data hämtas
            loadingIndicator.style.display = 'block';

            currentUser = user;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.monthlySalary) {
                        monthlySalaryInput.value = userData.monthlySalary;
                        await updateExpectedSalaryAndCharts(userData.monthlySalary, user.uid);
                        salaryInputContainer.style.display = 'none'; // Dölj inmatningsfältet och knappen
                    }
                }
            } catch (error) {
                console.error('Fel vid hämtning av användardata:', error);
            }

            // Dölj laddningsindikator efter att data har hämtats
            loadingIndicator.style.display = 'none';

            // Event listener för att spara månadslön
            saveSalaryButton.addEventListener('click', async () => {
                const monthlySalary = parseFloat(monthlySalaryInput.value);
                if (isNaN(monthlySalary) || monthlySalary <= 0) {
                    alert('Vänligen ange en giltig månadslön.');
                    return;
                }

                try {
                    await setDoc(doc(db, "users", user.uid), { monthlySalary: monthlySalary }, { merge: true });
                    await updateExpectedSalaryAndCharts(monthlySalary, user.uid);
                    alert('Månadslön sparad.');
                    salaryInputContainer.style.display = 'none'; // Dölj inmatningsfältet och knappen efter att ha sparat
                } catch (error) {
                    console.error('Fel vid sparande av månadslön:', error);
                    alert('Ett fel uppstod vid sparande av din månadslön.');
                }
            });

            // Event listener för att nollställa lön
            resetSalaryButton.addEventListener('click', async () => {
                try {
                    await setDoc(doc(db, "users", user.uid), { monthlySalary: 0 }, { merge: true });
                    monthlySalaryInput.value = '';
                    expectedSalaryDisplay.textContent = '';
                    salaryInputContainer.style.display = 'block'; // Visa inmatningsfältet och knappen igen
                    alert('Månadslön nollställd.');
                } catch (error) {
                    console.error('Fel vid nollställning av månadslön:', error);
                    alert('Ett fel uppstod vid nollställning av din månadslön.');
                }
            });

        } else {
            // Ingen användare är inloggad
            console.error('Ingen användare är inloggad.');
        }
    });

    // Funktion för att uppdatera förväntad årsinkomst och grafer
    async function updateExpectedSalaryAndCharts(monthlySalary, uid) {
        let totalProvision = 0;
        let monthlyEarnings = [];

        try {
            const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const revenue = data.revenue ? data.revenue : 0;
                const provision = Math.max(0, (revenue - 7816) * 0.17);
                totalProvision += provision;
                const monthlyTotal = monthlySalary + provision;

                monthlyEarnings.push(monthlyTotal);
            });

            const expectedAnnualSalary = (monthlySalary * 12) + totalProvision;
            expectedSalaryDisplay.textContent = `Förväntad årslön: ${expectedAnnualSalary.toLocaleString()} kr`;

            // Uppdatera grafer
            updateCharts(monthlyAverageChartCtx, overallAverageChartCtx, monthlyEarnings, totalProvision);
        } catch (error) {
            console.error('Fel vid hämtning av provision:', error);
        }
    }

    // Funktion för att uppdatera grafer
    function updateCharts(monthlyCtx, overallCtx, monthlyEarnings, totalProvision) {
        const monthlyAverage = monthlyEarnings.reduce((a, b) => a + b, 0) / monthlyEarnings.length;
        const overallAverage = (monthlyAverage * 12);

        new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: monthlyEarnings.length }, (_, i) => `Månad ${i + 1}`),
                datasets: [{
                    label: 'Snittmånadslön inklusive provision',
                    data: monthlyEarnings,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        new Chart(overallCtx, {
            type: 'line',
            data: {
                labels: Array.from({ length: monthlyEarnings.length }, (_, i) => `Månad ${i + 1}`),
                datasets: [{
                    label: 'Förväntad årsinkomst med provision',
                    data: Array(monthlyEarnings.length).fill(overallAverage),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Funktion för att räkna ut förväntad lön (utan provision)
    function calculateExpectedSalary(monthlySalary) {
        return `Förväntad årslön: ${(monthlySalary * 12).toLocaleString()} kr`;
    }
});
