import { db } from './firebaseConfig.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const provisionForm = document.getElementById('provision-form');
const resultDiv = document.getElementById('result');
const messageDiv = document.getElementById('message');

if (provisionForm) {
    provisionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const daysWorked = document.getElementById('daysWorked').value;
        const revenue = document.getElementById('revenue').value;
        const monthlySalary = document.getElementById('monthlySalary').value;

        try {
            const dailyRate = 7816;
            const multiplier = 0.17;

            const intermediateResult = daysWorked * dailyRate;
            const remainingRevenue = revenue - intermediateResult;
            const provision = remainingRevenue * multiplier;
            const totalIncome = parseFloat(monthlySalary) + provision;

            resultDiv.innerHTML = `Din provision är: ${Math.round(provision)} kr<br>Din totala inkomst med månadslön är: ${Math.round(totalIncome)} kr`;

            await addDoc(collection(db, "provisions"), {
                date: new Date().toISOString().slice(0, 10),
                daysWorked: parseFloat(daysWorked),
                revenue: parseFloat(revenue),
                monthlySalary: parseFloat(monthlySalary),
                provision: Math.round(provision),
                totalIncome: Math.round(totalIncome)
            });

            messageDiv.textContent = 'Data sparad!';
        } catch (error) {
            console.error('Fel vid sparande:', error);
            messageDiv.textContent = 'Fel vid sparande. Försök igen.';
        }
    });
}
