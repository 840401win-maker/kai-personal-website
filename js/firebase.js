import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
    doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBsdlmDz1LTcQiqlIYBbWbjdUZq0OzUXe0",
    authDomain: "kainursinglife.firebaseapp.com",
    projectId: "kainursinglife",
    storageBucket: "kainursinglife.firebasestorage.app",
    messagingSenderId: "203530414702",
    appId: "1:203530414702:web:3b76c908dfffcbf204147f",
    measurementId: "G-5JH7SP3NS2"
};

const ADMIN_UID = 'mYD4xk4Ii1aQI7DZSzC1kwllp5z1';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.fb = { db, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, auth, signInWithEmailAndPassword, signOut, doc, updateDoc, deleteDoc };

onAuthStateChanged(auth, (user) => {
    const isAdmin = !!(user && user.uid === ADMIN_UID);
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { isAdmin } }));
});

window.dispatchEvent(new Event('fb-ready'));
