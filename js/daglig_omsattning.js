import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, addDoc, deleteDoc, serverTimestamp, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Svenska helgdagar
const holidays = {
    "01-01": "Nyårsdagen",
    "06-06": "Nationaldagen",
    "12-24": "Julafton",
    "12-25": "Juldagen",
    "12-26": "Annandag jul",
    "12-31": "Nyårsafton"
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
const closePopupButton = document.getElementById('closePopup');
const printButton = document.getElementById('printButton');
const isVacationDayCheckbox = document.getElementById('isVacationDay');
const vacationSalaryField = document.getElementById('vacationSalaryField');
const vacationSalaryInput = document.getElementById('vacationSalary');
const popup = document.getElementById('popup'); // Popup elementet
let currentUser = null;
let monthlySalary = 0;

// Visa eller dölj fältet för semesterdaglön baserat på checkbox status
isVacationDayCheckbox.addEventListener('change', function() {
    if (this.checked) {
        vacationSalaryField.style.display = 'block';
    } else {
        vacationSalaryField.style.display = 'none';
        vacationSalaryInput.value = ''; // Rensa värdet när fältet göms
    }
});

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
    const isVacationDay = document.getElementById('isVacationDay')?.checked || false;
    const vacationSalary = parseFloat(document.getElementById('vacationSalary')?.value) || 0;
    const isSickDay = document.getElementById('isSickDay')?.checked || false;
    const unionHours = parseFloat(document.getElementById('unionHours')?.value) || 0;
    const unionWage = parseFloat(document.getElementById('unionWage')?.value) || 0;
    const isFullDayUnion = document.getElementById('isFullDayUnion')?.checked || false;
    const distanceBonus = parseFloat(document.getElementById('distanceBonus')?.value) || 0;

    let dailyProvision = 0;
    let totalSalary = 0;
    let provisionReduction = 0;
    let unionSalary = 0;
    let displayRevenue = '';
    let displaySalary = '';

    // Beräkning för facklig tid och lön
    if (isFullDayUnion) {
        provisionReduction = 7816;
        unionSalary = 8 * unionWage;
    } else {
        provisionReduction = unionHours * 977;
        unionSalary = unionHours * unionWage;
    }

    // Hantera semester och sjukdagar
    if (isVacationDay) {
        displayRevenue = 'Semester';
        totalSalary = vacationSalary;  // Lägg till semesterdaglönen
        displaySalary = `${Math.round(totalSalary)} kr`; // Visa semesterdaglönen
        provisionReduction = 7816; // Minska provisionsgränsen med 7816 kr
        revenueInput.value = ''; // Tömma omsättningsfältet
    } else if (isSickDay) {
        displayRevenue = 'Sjuk/VAB';
        displaySalary = 'Sjuk/VAB';
        revenueInput.value = '';
    } else {
        dailyProvision = Math.max(0, revenue - (7816 - provisionReduction)) * 0.17;
        totalSalary = dailyProvision + (monthlySalary / 21) + unionSalary + distanceBonus;
        displayRevenue = `${Math.round(revenue)} kr`;
        displaySalary = `${Math.round(totalSalary)} kr`;
    }

    // Spara data till Firestore
    try {
        await addDoc(collection(db, 'revenues'), {
            uid: currentUser.uid,
            date: date,
            revenue: revenue,
            displayRevenue: displayRevenue,
            displaySalary: displaySalary,
            isVacationDay: isVacationDay,
            vacationSalary: vacationSalary, // Spara semesterdaglönen
            isSickDay: isSickDay,
            unionHours: unionHours,
            unionWage: unionWage,
            isFullDayUnion: isFullDayUnion,
            dailyProvision: dailyProvision,
            totalSalary: totalSalary,
            distanceBonus: distanceBonus,
            provisionReduction: provisionReduction,
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

    // Visa popupen
    popup.classList.remove('hidden');
    popup.classList.add('show');

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
        let totalProvisionReduction = 0;
        let totalVacationProvisionReduction = 0; // Lägg till semesterdagarnas reduktion
        let totalVacationSalary = 0; // Lägg till för att samla semesterdagarnas lön

        popupTable.innerHTML = ''; // Töm tabellen innan ny data läggs till

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            console.log("Datum:", data.date, "Omsättning:", data.revenue);

            const dateObj = new Date(data.date);
            const dayOfWeek = dateObj.getDay(); // Söndag = 0, Måndag = 1, ..., Lördag = 6

            if (data.isVacationDay) {
                totalVacationSalary += data.vacationSalary; // Lägg till semesterdaglön
                totalVacationProvisionReduction += 7816; // Subtrahera 7816 kr per semesterdag från provisionsgränsen
            } else if (dayOfWeek >= 1 && dayOfWeek <= 5 && !data.isSickDay) {
                workDays++;
                totalRevenue += data.revenue;
                totalEarnings += data.totalSalary; // Lägg till intjänad lön för varje arbetsdag
            }

            // Samla provisionReduction baserat på facklig tid
            if (data.isFullDayUnion) {
                totalProvisionReduction += 7816;
            } else {
                totalProvisionReduction += data.unionHours * 977;
            }

            const row = popupTable.insertRow();
            row.innerHTML = `
                <td>${new Date(data.date).toLocaleDateString()}</td>
                <td>${data.isFullDayUnion ? 'Fackligt Arbete' : (data.revenue ? `${Math.round(data.revenue)} kr` : 'N/A')}</td>
                <td>${data.isVacationDay || data.isSickDay ? 'Sjuk/semester' : `${Math.round(data.totalSalary)} kr`}</td>
                <td><button class="delete-btn" data-id="${docSnapshot.id}">Ta bort</button></td>
            `;

            // Lägg till klick-hanterare för att ta bort data
            row.querySelector('.delete-btn').addEventListener('click', async (event) => {
                const docId = event.target.getAttribute('data-id');
                if (confirm('Är du säker på att du vill ta bort denna post?')) {
                    try {
                        const docRef = doc(db, "revenues", docId);
                        await deleteDoc(docRef);
                        alert('Dagen har tagits bort.');
                        row.remove(); // Ta bort raden från tabellen
                    } catch (error) {
                        console.error('Fel vid borttagning av dokument:', error);
                        alert('Det gick inte att ta bort dagen. Försök igen senare.');
                    }
                }
            });
        });

        // Uppdatera provisionsgränsen med semesterdagarnas reduktion
        const provisionLimit = (workDays * 7816) - totalProvisionReduction - totalVacationProvisionReduction;

        // Uppdatera total intjänad lön med semesterdaglön
        totalEarnings += totalVacationSalary;

        const averageSalary = workDays > 0 ? totalEarnings / workDays : 0;
        const averageRevenue = workDays > 0 ? totalRevenue / workDays : 0;

        // Uppdatera UI med alla resultat
        document.getElementById('totalRevenueDisplay').innerText = `Total Omsättning: ${Math.round(totalRevenue)} kr`;
        document.getElementById('workDaysDisplay').innerText = `Arbetsdagar: ${workDays}`;
        document.getElementById('provisionLimitDisplay').innerText = `Provisionsgräns: ${Math.round(provisionLimit)} kr`;
        document.getElementById('currentEarningsDisplay').innerText = `Intjänad lön: ${Math.round(totalEarnings)} kr`;
        document.getElementById('averageSalaryDisplay').innerText = `Snittlön: ${Math.round(averageSalary)} kr/dag`;
        document.getElementById('averageRevenueDisplay').innerText = `Snittomsättning: ${Math.round(averageRevenue)} kr/dag`;

    } catch (error) {
        console.error('Fel vid hämtning av data:', error);
    }
});

// Stäng popupen när man klickar på krysset
closePopupButton.addEventListener('click', () => {
    popup.classList.remove('show');
    popup.classList.add('hidden');
});

// Lägg till en knapp för utskrift av popupen
printButton.addEventListener('click', () => {
    window.print(); // Skriver ut hela popupen
});
