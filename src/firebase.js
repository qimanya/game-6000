import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_yXL6KmXxRsQMXp3lSf-QlxVQXjJFXQk",
  authDomain: "manya-30a04.firebaseapp.com",
  projectId: "manya-30a04",
  storageBucket: "manya-30a04.appspot.com",
  messagingSenderId: "647712263523",
  appId: "1:647712263523:web:2492ad7e1dcbd287809756",
  measurementId: "G-SZHGRNYG55"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 