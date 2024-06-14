import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, orderBy, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const revenueList = document.getElementById('revenueList');
const resetRevenueButton = document.getElementById('resetRevenue');
const loadingIndicator = document.getElementById('loadingIndicator');

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchRevenues(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

async function saveRevenue() {
    if (!currentUser) return;
    const date = document.getElementById('date').value;
    const revenue = parseFloat(document.getElementById('revenue').value);
    const uid = currentUser.uid;
    try {
        loadingIndicator.style.display = 'block';
        await setDoc(doc(db, "revenues", `${uid}_${date}`), { uid, date, revenue });
        loadingIndicator.style.display = 'none';
        alert('Omsättning sparad!');
        fetchRevenues(uid);
    } catch (error) {
        loadingIndicator.style.display = 'none';
        console.error('Fel vid sparande av omsättning:', error);
        alert('Fel vid sparande av omsättning. Försök igen.');
    }
}

async function fetchRevenues(uid) {
    if (!uid) return;
    loadingIndicator.style.display = 'block';
    const q = query(collection(db, "revenues"), where("uid", "==", uid), orderBy("date"));
    const querySnapshot = await getDocs(q);
    revenueList.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const listItem = document.createElement('div');
        listItem.textContent = `${data.date}: ${data.revenue} kr`;
        revenueList.appendChild(listItem);
    });
    loadingIndicator.style.display = 'none';
}

resetRevenueButton.addEventListener('click', async () => {
    if (!currentUser) return;
    const confirmation = confirm("Är du säker på att du vill nollställa din dagliga omsättning?");
    if (!confirmation) return;

    const uid = currentUser.uid;
    loadingIndicator.style.display = 'block';
    const q = query(collection(db, "revenues"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    const batch = db.batch();
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    loadingIndicator.style.display = 'none';
    alert('Daglig omsättning nollställd!');
    fetchRevenues(uid);
});
