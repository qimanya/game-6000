import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD-TNMERMJYIdHFGJRnueHoWKF3vvQjfpQ",
  authDomain: "ojbk-2fb8c.firebaseapp.com",
  projectId: "ojbk-2fb8c",
  storageBucket: "ojbk-2fb8c.firebasestorage.app",
  messagingSenderId: "831587459313",
  appId: "1:831587459313:web:8c3211ece2326606108950"
};

let app, db;
if (typeof window !== "undefined") {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
}

export function writeTestPlayer() {
  if (!db) return;
  const playersRef = ref(db, 'players');
  const newPlayerRef = push(playersRef);
  set(newPlayerRef, {
    id: Math.floor(Math.random() * 10000),
    test: true
  });
}

export { db }; 