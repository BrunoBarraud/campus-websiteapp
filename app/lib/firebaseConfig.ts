import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "campus-virtual-velez.firebaseapp.com",
  projectId: "campus-virtual-velez",
  storageBucket: "campus-virtual-velez.firebasestorage.app",
  messagingSenderId: "1054689382153",
  appId: "1:1054689382153:web:6a905f8d91c972075a0dd8",
  measurementId: "G-96FVFTF6M0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
