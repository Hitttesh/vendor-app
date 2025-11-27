// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage, ref as fbRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_APIKEY || "AIzaSyDXevidklsZ5l31qkXJN7HGwMdodqLL9R4",
  authDomain: process.env.REACT_APP_FIREBASE_AUTHDOMAIN || "global-caseway-6602a.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECTID || "global-caseway-6602a",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGEBUCKET || "global-caseway-6602a.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGINGSENDERID || "617229832875",
  appId: process.env.REACT_APP_FIREBASE_APPID || "1:617229832875:web:5e51551238207e4cac1dee",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENTID || "G-BC5M80EC6L"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage, fbRef, uploadBytesResumable, getDownloadURL };