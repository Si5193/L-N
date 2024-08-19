import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, addDoc, deleteDoc, serverTimestamp, query, where, getDocs, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Svenska helgdagar
const holidays = {
    "01-01": "Nyårsdagen",
    "06-06": "Nationaldagen",
    "12-24": "Julafton",
    "12-25": "Juldagen",
    "12-26": "Annandag jul",
    "12-31": "Nyårsafton"
    // Lägg till fler helgdagar här
};

// Variabler för att referera till element
const omsattningForm = document.getElementById('omsattningForm');
const showRevenueButton = document.getElementById('showRevenue');
const monthInput = document.getElementById('month');
const resetDataButton = document.getElementById('resetData');
const resetMonthInput = document.getElementById('resetMonth');
const popupTable = document.getElementById('popupTable').getElementsByTagName('tbody')[0];
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progressText');
const closePopupButton = document.getElementById('closePopup'); // Stäng-knappen för popup
let currentUser = null;
let monthlySalary = 0;

// Hämta användarens information
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await fetchMonthlySalary(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Hämta månadslönen för den inloggade användaren
async function fetchMonthlySalary(uid) {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        monthlySalary = userDoc.data().monthlySalary;
    }
}

// Hantera formulärinlämning för att spara omsättning
omsattningForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Formulär inlämnat");

    const date = document.getElementById('date').value;
    const revenueInput = document.getElementById('revenue');
    const revenue = parseFloat(revenueInput.value) || 0;
    const isVacationDay = document.getElementById('isVacationDay').checked;
    const isSickDay = document.getElementById('isSickDay').checked;

    const unionHours = parseFloat(document.getElementById('unionHours')?.value) || 0;
    const unionWage = parseFloat(document.getElementById('unionWage')?.value) || 0;
    const isFullDayUnion = document.getElementById('isFullDayUnion')?.checked || false;
    const distanceBonus = parseFloat(document.getElementById('distanceBonus')?.value) || 0;

    let dailyProvision = 0;
    let totalSalary = 0;
    let displayRevenue = '';
    let displaySalary = '';

    let provisionReduction = 0;
    let unionIncome = 0;

    if (isVacationDay) {
        displayRevenue = 'Semester';
        displaySalary = 'Semester';
        revenueInput.value = '';
    } else if (isSickDay) {
        displayRevenue = 'Sjuk/VAB';
        displaySalary = 'Sjuk/VAB';
        revenueInput.value = '';
    } else {
        // Beräkna provisionsgränsreduktion för facklig tid
        if (isFullDayUnion) {
            provisionReduction = 7816 * 8;
            unionIncome = unionWage * 8;
        } else if (unionHours > 0) {
            provisionReduction = 977 * unionHours;
            unionIncome = unionWage * unionHours;
        }

        // Beräkna provision och lön
        const adjustedProvisionLimit = 7816 - provisionReduction;
        dailyProvision = Math.max(0, revenue - adjustedProvisionLimit) * 0.17;
        totalSalary = dailyProvision + (monthlySalary / 21) + unionIncome + distanceBonus;

        displayRevenue = `${Math.round(revenue)} kr`;
        displaySalary = `${Math.round(totalSalary)} kr`;
    }

    try {
        await addDoc(collection(db, 'revenues'), {
            uid: currentUser.uid,
            date: date,
            revenue: revenue,
            displayRevenue: displayRevenue,
            displaySalary: displaySalary,
            isVacationDay: isVacationDay,
            isSickDay: isSickDay,
            dailyProvision: dailyProvision,
            totalSalary: totalSalary,
            unionHours: unionHours,
            unionWage: unionWage,
            isFullDayUnion: isFullDayUnion,
            distanceBonus: distanceBonus,
            provisionReduction: provisionReduction,
            unionIncome: unionIncome,
            timestamp: serverTimestamp()
        });
        alert('Omsättning sparad!');
        omsattningForm.reset();
    } catch (error) {
        console.error('Error adding document: ', error);
    }
});

// Hantera visning av omsättning för vald månad
showRevenueButton.addEventListener('click', async () => {
    console.log("Visa Omsättning-knappen klickades");

    const selectedMonth = monthInput.value;
    if (!selectedMonth) {
        alert('Vänligen välj en månad.');
        return;
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    console.log(`Visar data för månad: ${year}-${month}`);

    // Hämta data från Firebase
    const q = query(
        collection(db, "revenues"),
        where("uid", "==", currentUser.uid),
        where("date", ">=", new Date(year, month - 1, 1).toISOString().split('T')[0]),
        where("date", "<=", new Date(year, month, 0).toISOString().split('T')[0]),
        orderBy("date")
    );

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            alert('Ingen data tillgänglig för den valda månaden.');
            return;
        }

        // Variabler för att hålla reda på totalsummor
        let totalRevenue = 0;
        let workDays = 0;
        let totalEarnings = 0;

        popupTable.innerHTML = ''; // Töm tabellen innan ny data läggs till

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Datum:", data.date, "Omsättning:", data.revenue);

            if (!data.isVacationDay && !data.isSickDay) {
                workDays++;
                totalRevenue += data.revenue;
            }

            let infoIcon = '';
            if (data.unionHours > 0 || data.distanceBonus > 0) {
                const tooltipText = `Facklig tid: ${data.unionHours} timmar, Lön: ${data.unionWage} kr/timme, Distanstillägg: ${data.distanceBonus} kr`;
                infoIcon = `<i class="fas fa-info-circle" title="${tooltipText}"></i>`;
            }

            const row = popupTable.insertRow();
            row.innerHTML = `
                <td>${new Date(data.date).toLocaleDateString()}</td>
                <td>${data.revenue ? `${Math.round(data.revenue)} kr` : 'N/A'} ${infoIcon}</td>
                <td>${data.isVacationDay || data.isSickDay ? 'Sjuk/semester' : `${Math.round(data.totalSalary)} kr`}</td>
            `;
        });

        // Nu summerar vi intjänad lön direkt från tabellen
        for (let i = 0; i < popupTable.rows.length; i++) {
            const salaryCell = popupTable.rows[i].cells[2]; // Kolumnen för intjänad lön
            const salaryValue = parseFloat(salaryCell.innerText.replace(' kr', '').replace('N/A', '0'));
            if (!isNaN(salaryValue)) {
                totalEarnings += salaryValue;
            }
        }

        const provisionLimit = workDays * 7816;
        const progressPercentage = (workDays / 21) * 100;
        const averageSalary = workDays > 0 ? totalEarnings / workDays : 0;

        console.log("Total intjänad lön från tabellen:", Math.round(totalEarnings));
        console.log("Snittlön per dag:", Math.round(averageSalary));

        // Uppdatera UI med alla resultat
        document.getElementById('totalRevenueDisplay').innerText = `Total Omsättning: ${Math.round(totalRevenue)} kr`;
        document.getElementById('workDaysDisplay').innerText = `Arbetsdagar: ${workDays}`;
        document.getElementById('provisionLimitDisplay').innerText = `Provisionsgräns: ${provisionLimit} kr`;
        document.getElementById('currentEarningsDisplay').innerText = `Intjänad lön: ${Math.round(totalEarnings)} kr`;
        document.getElementById('averageSalaryDisplay').innerText = `Snittlön: ${Math.round(averageSalary)} kr/dag`;

        progressBar.style.width = `${progressPercentage}%`;
        progressText.innerText = `Du har ${21 - workDays} dagar kvar att arbeta denna månad.`;

        // Visar popupen
        document.getElementById('popup').classList.remove('hidden');
        document.getElementById('popup').classList.add('show');

    } catch (error) {
        console.error('Fel vid hämtning av data:', error);
    }
});

// Funktion för att stänga popup-fönstret
closePopupButton.addEventListener('click', () => {
    console.log("Stänger popup-fönstret");
    document.getElementById('popup').classList.remove('show');
    document.getElementById('popup').classList.add('hidden');
});

// Funktion för att nollställa data för vald månad
resetDataButton.addEventListener('click', async () => {
    console.log("Nollställningsknappen klickades");

    const selectedMonth = resetMonthInput.value;
    if (!selectedMonth) {
        alert('Vänligen välj en månad att nollställa.');
        return;
    }

    const [year, month] = selectedMonth.split('-').map(Number);

    if (confirm(`Är du säker på att du vill nollställa all data för ${selectedMonth}?`)) {
        const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

        const q = query(
            collection(db, "revenues"),
            where("uid", "==", currentUser.uid),
            where("date", ">=", startOfMonth),
            where("date", "<=", endOfMonth)
        );

        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                alert('Ingen data tillgänglig för den valda månaden.');
                return;
            }

            // Skapa en batch-operation
            const batch = writeBatch(db);

            querySnapshot.forEach((doc) => {
                const docRef = doc.ref;
                batch.delete(docRef);
            });

            await batch.commit();
            alert(`All data för ${selectedMonth} har nollställts.`);
            console.log(`Data nollställd för månad: ${selectedMonth}`);

        } catch (error) {
            console.error('Fel vid nollställning av data: ', error);
            alert('Det gick inte att nollställa datan. Försök igen senare.');
        }
    }
});
