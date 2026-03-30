import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDDZc9JVd-yKys2BR55IHTdEjAkh-cEbXs',
  authDomain: 'ask-gpt-app.vercel.app',
  projectId: 'ask-gpt-2f61d',
  storageBucket: 'ask-gpt-2f61d.firebasestorage.app',
  messagingSenderId: '280092322654',
  appId: '1:280092322654:web:5e9599877929634466bdcf',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
