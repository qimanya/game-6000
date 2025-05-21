import { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const AVAILABLE_ROLES = ['Student', 'Teacher', 'Guard'];
// 你可以把 crisisCards, actionCards, ROLE_CARD_TYPES 复制进来

export default function HomeClient() {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const dbRef = useRef(null);

  useEffect(() => {
    if (!dbRef.current) {
      const app = initializeApp(firebaseConfig);
      dbRef.current = getDatabase(app);
    }
    const db = dbRef.current;

    // 生成玩家ID
    const newPlayerId = String(Math.floor(Math.random() * 9000) + 1000);
    setPlayerId(newPlayerId);

    // 监听游戏状态
    const gameStateRef = ref(db, 'gameState');
    onValue(gameStateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameState(data);
    });

    // 添加玩家
    const playersRef = ref(db, 'players');
    const newPlayerRef = push(playersRef);
    set(newPlayerRef, {
      id: newPlayerId,
      hand: [],
      role: '',
      has_played_this_turn: false,
      lastSeen: Date.now()
    });

    // 清理函数
    return () => {
      if (newPlayerRef) {
        remove(newPlayerRef);
      }
    };
  }, []);

  return (
    <div>
      <h1>Truth Unlocked</h1>
      <div>Player ID: {playerId}</div>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
    </div>
  );
} 