import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBXkN1UfotGkxj_ucnBnlZCBQBoGWykHZM",
  authDomain: "cardapiomhlanches.firebaseapp.com",
  databaseURL: "https://cardapiomhlanches-default-rtdb.firebaseio.com",
  projectId: "cardapiomhlanches",
  storageBucket: "cardapiomhlanches.firebasestorage.app",
  messagingSenderId: "919725344771",
  appId: "1:919725344771:web:69be07a143162e76cf2636"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
