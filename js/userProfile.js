import { auth } from './firebaseConfig.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const userProfile = document.getElementById('user-profile');
const dropdownContent = document.getElementById('dropdown-content');
const logoutButton = document.getElementById('logout');

userProfile.addEventListener('click', () => {
    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});
