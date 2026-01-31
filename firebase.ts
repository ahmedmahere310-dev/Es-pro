import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCRVGDn1M_zy5p7HGsNV0dLweMKRs_5JzA",
  authDomain: "elshla.firebaseapp.com",
  databaseURL: "https://elshla-default-rtdb.firebaseio.com",
  projectId: "elshla",
  storageBucket: "elshla.firebasestorage.app",
  messagingSenderId: "225364230201",
  appId: "1:225364230201:web:ffa36b14888763a1e64de8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const DB_ROOT = "es_v_admin_pro";
