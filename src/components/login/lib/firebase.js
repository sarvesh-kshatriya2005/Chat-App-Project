import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chat-app-cbada.firebaseapp.com",
  projectId: "chat-app-cbada",
  messagingSenderId: "2175705632",
  appId: "1:2175705632:web:7f7ccc3161736356d15245"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();