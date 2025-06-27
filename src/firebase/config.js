import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAqYxNCUwi2ezqivzZjavysUbxkpWG_HsI",
  authDomain: "chat-58b26.firebaseapp.com",
  projectId: "chat-58b26",
  storageBucket: "chat-58b26.firebasestorage.app",
  messagingSenderId: "303868298879",
  appId: "1:303868298879:web:c3b7a903c5861079bda14a",
  measurementId: "G-58WLXJKGJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, analytics }; 