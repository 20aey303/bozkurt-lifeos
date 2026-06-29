import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEd9v9NwmakKaiBMBwZ_ODED6S1rX7Y4o",
  authDomain: "bozkurt-lifeos-c7e64.firebaseapp.com",
  projectId: "bozkurt-lifeos-c7e64",
  storageBucket: "bozkurt-lifeos-c7e64.firebasestorage.app",
  messagingSenderId: "219313495347",
  appId: "1:219313495347:web:c72480665daedce28b7246",
  measurementId: "G-BXQHZVN71P"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
