import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const omsattningForm = document.getElementById('omsattningForm');
const resetValuesButton = document.getElementById('resetValues');

let currentUser = null;
let monthlySalary = 0;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchMonthlySalary(user.uid);
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

omsattningForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const revenue = parseFloat(document.getElementById('revenue').value) || 0;
    const isSickDay = document.getElementById('isSickDay').checked;
    const isVacationDay = document.getElementById('isVacationDay').checked;
    const vacationValue = parseFloat(document.getElementById('vacationValue').value) || 0;
    const dailySalary = monthlySalary / 21;
    
    let dailyProvision = 0;
    let totalSalary = 0;

    if (isSickDay) {
        dailyProvision = await handleSickDay(date, dailySalary);
        totalSalary = dailySalary * 0.8;
    } else if (isVacationDay) {
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
            isSickDay: isSickDay,
            isVacationDay: isVacationDay,
            vacationValue: vacationValue,
            totalSalary: totalSalary,
            timestamp: serverTimestamp()
        });
        alert('Omsättning sparad!');
        omsattningForm.reset();
    } catch (error) {
        console.error('Error adding document: ', error);
    }
});

resetValuesButton.addEventListener('click', async () => {
    try {
        const q = query(collection(db, 'revenues'), where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const batch = db.batch();
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        alert('Värden nollställda!');
    } catch (error) {
        console.error('Error resetting values: ', error);
    }
});

async function handleSickDay(date, dailySalary) {
    let sickDays = 0;
    let provision = 0;

    try {
        const q = query(collection(db, "revenues"), where("uid", "==", currentUser.uid), where("isSickDay", "==", true));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (new Date(data.date) <= new Date(date)) {
                sickDays++;
                if (sickDays == 1) {
                    provision -= dailySalary; // Karensdag
                } else {
                    provision += dailySalary * 0.8; // 80% av dagslön
                }
            }
        });

        return provision;
    } catch (error) {
        console.error('Error handling sick day: ', error);
        return 0;
    }
}
