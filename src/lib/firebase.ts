import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDWpai-ZoSXgDLH5KECwDmgw7EnZ92NxG8",
  authDomain: "civiclens-89c48.firebaseapp.com",
  projectId: "civiclens-89c48",
  storageBucket: "civiclens-89c48.firebasestorage.app",
  messagingSenderId: "577314823775",
  appId: "1:577314823775:web:9cd130b9272427ca8185ea",
  measurementId: "G-E9TKKXKDTS",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only runs in the browser
if (typeof window !== "undefined") {
  getAnalytics(app);
}
