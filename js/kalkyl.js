import { auth, db } from './firebaseConfig.js';
import { collection, addDoc, query, orderBy, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const kalkylForm = document.getElementById('kalkyl-form');
const messageDiv = document.getElementById('message');
const revenueList = document.getElementById('revenue-list');

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchRevenues(user.uid);
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

// Event listener för att hantera formulärskickning
if (kalkylForm) {
    kalkylForm.addEventListener('submit', async (e) => {
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
            kalkylForm.reset();
            fetchRevenues(currentUser.uid); // Hämta och visa uppdaterad lista
        } catch (error) {
            console.error('Fel vid sparande:', error);
            messageDiv.textContent = 'Fel vid sparande. Försök igen.';
        }
    });
}
