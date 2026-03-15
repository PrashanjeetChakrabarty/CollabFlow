import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "collabflowweb-7158f.firebaseapp.com",
    databaseURL: "https://collabflowweb-7158f-default-rtdb.firebaseio.com",
    projectId: "collabflowweb-7158f",
    storageBucket: "collabflowweb-7158f.firebasestorage.app",
    messagingSenderId: "730936510774",
    appId: "1:730936510774:web:107d8df162d56c94c08b97",
    measurementId: "G-JMKFDJT1FE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
