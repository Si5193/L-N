import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const historyContainer = document.getElementById('historyContainer');
    
    if (!historyContainer) {
        console.error("historyContainer element is not found.");
        return;
    }

    let currentUser = null;
    let monthlySalary = 0;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await fetchMonthlySalary(user.uid);
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

        historyContainer.innerHTML = '';

        let totalRevenue = 0;
        let totalProvision = 0;
        let totalDays = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.date).toLocaleDateString();
            const revenue = data.revenue ? data.revenue.toFixed(2) : '0.00';
            const dailyProvision = data.dailyProvision ? data.dailyProvision.toFixed(2) : '0.00';

            totalRevenue += parseFloat(revenue);
            totalProvision += parseFloat(dailyProvision);
            totalDays++;

            const dayData = document.createElement('div');
            dayData.classList.add('day-data');
            dayData.innerHTML = `
                <p>Datum: ${date}</p>
                <p>Omsättning: ${revenue} kr</p>
            `;
            historyContainer.appendChild(dayData);
        });

        const dailySalary = monthlySalary / 21;
        const totalMonthlySalary = dailySalary * totalDays;
        const totalIncome = totalProvision + totalMonthlySalary;

        const summaryData = document.createElement('div');
        summaryData.classList.add('summary-data');
        summaryData.innerHTML = `
            <p>Total Omsättning: ${totalRevenue.toFixed(2)} kr</p>
            <p>Total Provision: ${totalProvision.toFixed(2)} kr</p>
            <p>Total Månadslön: ${totalMonthlySalary.toFixed(2)} kr</p>
            <p>Total Lön inkl Provision: ${totalIncome.toFixed(2)} kr</p>
        `;
        historyContainer.appendChild(summaryData);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                console.log('Noder har lagts till eller tagits bort.');
            }
        });
    });

    observer.observe(historyContainer, { childList: true });
});
