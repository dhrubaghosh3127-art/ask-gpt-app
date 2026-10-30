import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDDZcVd-yKR55IHTdEjAkh-cEbXs',
  authDomain: 'ask-gpt-2f61d.firebaseapp.com',
  projectId: 'ask-gpt-d',
  storageBucket: 'ask-gpt-2d.firebasestorage.app',
  messagingSenderId: '2800922654',
  appId: '1:2822654:web:5e9l77929634466bdcf',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
