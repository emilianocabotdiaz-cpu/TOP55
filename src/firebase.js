// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPgYBWxJhzeRCdnkWj7uFJts7eWuy-J0o",
  authDomain: "super55.firebaseapp.com",
  projectId: "super55",
  storageBucket: "super55.firebasestorage.app",
  messagingSenderId: "419421679286",
  appId: "1:419421679286:web:7ee32f7e60a5ed91bb4017",
  measurementId: "G-QNC24THDPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
