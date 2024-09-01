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
    const isVacationDay = document.getElementById('isVacationDay')?.checked || false;
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
        displaySalary = 'Semester';
        revenueInput.value = '';
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
            isSickDay: isSickDay,
            unionHours: unionHours,
            unionWage: unionWage,
            isFullDayUnion: isFullDayUnion,
            dailyProvision: dailyProvision,
            totalSalary: totalSalary,
            distanceBonus: distanceBonus,
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
        let totalProvisionReduction = 0;

        popupTable.innerHTML = ''; // Töm tabellen innan ny data läggs till

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            console.log("Datum:", data.date, "Omsättning:", data.revenue);

            const dateObj = new Date(data.date);
            const dayOfWeek = dateObj.getDay(); // Söndag = 0, Måndag = 1, ..., Lördag = 6

            if (dayOfWeek >= 1 && dayOfWeek <= 5 && !data.isVacationDay && !data.isSickDay) { // Endast måndag till fredag
                workDays++;
                totalRevenue += data.revenue;
            }

            // Samla provisionReduction baserat på facklig tid
            if (data.isFullDayUnion) {
                totalProvisionReduction += 7816;
            } else {
                totalProvisionReduction += data.unionHours * 977;
            }

            let infoIcon = '';
            if (data.unionHours > 0 || data.isFullDayUnion || data.distanceBonus > 0) {
                const tooltipText = data.isFullDayUnion 
                    ? `Facklig heldag, Lön: ${8 * data.unionWage} kr`
                    : `Facklig tid: ${data.unionHours} timmar, Lön: ${data.unionWage} kr/timme, Distanstillägg: ${data.distanceBonus} kr`;
                infoIcon = `<i class="fas fa-info-circle info-icon tooltip"><span class="tooltiptext">${tooltipText}</span></i>`;
            }

            const row = popupTable.insertRow();
            row.innerHTML = `
                <td>${new Date(data.date).toLocaleDateString()}</td>
                <td>${data.isFullDayUnion ? 'Fackligt Arbete' : (data.revenue ? `${Math.round(data.revenue)} kr` : 'N/A')} ${infoIcon}</td>
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

            // Lägg till klick-hanterare för mobilvänlig tooltip
            const infoIconElement = row.querySelector('.info-icon');
            if (infoIconElement) {
                infoIconElement.addEventListener('click', (event) => {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'mobile-tooltip';
                    tooltip.innerText = event.target.getAttribute('data-tooltip');
                    document.body.appendChild(tooltip);

                    // Placera tooltip nära ikonen
                    const rect = event.target.getBoundingClientRect();
                    tooltip.style.left = `${rect.left}px`;
                    tooltip.style.top = `${rect.bottom + 5}px`;

                    // Ta bort tooltipen efter en tid
                    setTimeout(() => {
                        tooltip.remove();
                    }, 3000);
                });
            }
        });

        const provisionLimit = (workDays * 7816) - totalProvisionReduction;
        const currentDate = new Date(); // Nuvarande datum
        const daysInMonth = new Date(year, month, 0).getDate(); // Totala antal dagar i vald månad

        let remainingWorkDays = 0;
        for (let i = currentDate.getDate(); i <= daysInMonth; i++) {
            const tempDate = new Date(year, month - 1, i);
            const dayOfWeek = tempDate.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Endast måndag till fredag
                remainingWorkDays++;
            }
        }

        const progressPercentage = (workDays / 21) * 100;
        const averageSalary = workDays > 0 ? totalEarnings / workDays : 0;

        console.log("Total intjänad lön från tabellen:", Math.round(totalEarnings));
        console.log("Snittlön per dag:", Math.round(averageSalary));

        // Uppdatera UI med alla resultat
        document.getElementById('totalRevenueDisplay').innerText = `Total Omsättning: ${Math.round(totalRevenue)} kr`;
        document.getElementById('workDaysDisplay').innerText = `Arbetsdagar: ${workDays}`;
        document.getElementById('provisionLimitDisplay').innerText = `Provisionsgräns: ${Math.round(provisionLimit)} kr`;
        document.getElementById('currentEarningsDisplay').innerText = `Intjänad lön: ${Math.round(totalEarnings)} kr`;
        document.getElementById('averageSalaryDisplay').innerText = `Snittlön: ${Math.round(averageSalary)} kr/dag`;

        progressBar.style.width = `${progressPercentage}%`;
        progressText.innerText = `Du har ${remainingWorkDays} dagar kvar att arbeta denna månad.`;

        // Visar popupen
        document.getElementById('popup').classList.remove('hidden');
        document.getElementById('popup').classList.add('show');

    } catch (error) {
        console.error('Fel vid hämtning av data:', error);
    }
});

document.getElementById('toggleUnionSection').addEventListener('click', () => {
    const unionSection = document.getElementById('unionSection');
    if (unionSection.style.display === 'none' || unionSection.style.display === '') {
        unionSection.style.display = 'block';
    } else {
        unionSection.style.display = 'none';
    }
});
