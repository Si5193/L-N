import { auth, db } from './firebaseConfig.js';
import { collection, addDoc, query, orderBy, getDocs, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const omsattningForm = document.getElementById('omsattning-form');
const messageDiv = document.getElementById('message');
const revenueList = document.getElementById('revenue-list');

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchRevenues(user.uid);
        setupRealtimeListener(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Funktion för att hämta och visa omsättningsdata
async function fetchRevenues(uid) {
    if (!uid) return;
    revenueList.innerHTML = ''; // Töm listan först
    const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const listItem = document.createElement('li');
        listItem.textContent = `${data.date}: ${data.revenue} kr`;
        revenueList.appendChild(listItem);
    });
}

// Funktion för att sätta upp en realtidslyssnare
function setupRealtimeListener(uid) {
    const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
    onSnapshot(q, (querySnapshot) => {
        fetchRevenues(uid); // Uppdatera omsättningsdata
    });
}

// Event listener för att hantera formulärskickning
if (omsattningForm) {
    omsattningForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('date').value;
        const revenue = document.getElementById('revenue').value;

        if (!currentUser) {
            alert('Användare inte inloggad.');
            return;
        }

        try {
            await addDoc(collection(db, "revenues"), {
                uid: currentUser.uid,
                date: date,
                revenue: parseFloat(revenue)
            });
            messageDiv.textContent = 'Data sparad!';
            omsattningForm.reset();
        } catch (error) {
            console.error('Fel vid sparande:', error);
            messageDiv.textContent = 'Fel vid sparande. Försök igen.';
        }
    });
}
