import { auth, db } from './firebaseConfig.js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const omsattningForm = document.getElementById('omsattningForm');

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
    const userDocRef = doc(db, "Users", uid);
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
        // Hantera sjukdag
        dailyProvision = handleSickDay(date, dailySalary);
        totalSalary = dailySalary * 0.8; // 80% av dagslön
    } else if (isVacationDay) {
        // Hantera semesterdag
        dailyProvision = 0;
        totalSalary = vacationValue;
    } else {
        // Hantera omsättningsdag
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

function handleSickDay(date, dailySalary) {
    let sickDays = 0;
    let provision = 0;
    let isKarensdag = true;

    return new Promise(async (resolve, reject) => {
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

            resolve(provision);
        } catch (error) {
            reject(error);
        }
    });
}
