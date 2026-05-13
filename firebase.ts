import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBWdbI6HW-_wXRfU5IEskEJdtvxkvwBDHI",
  authDomain: "drivesafe-496020.firebaseapp.com",
  databaseURL: "https://drivesafe-496020-default-rtdb.firebaseio.com",
  projectId: "drivesafe-496020",
  storageBucket: "drivesafe-496020.firebasestorage.app",
  messagingSenderId: "395406520489",
  appId: "1:395406520489:web:d860c8d3ff8481496039b8",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
