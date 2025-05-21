import { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, remove, push, serverTimestamp } from "firebase/database";

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
const crisisCards = [
  // ... 只粘贴部分，实际请补全 ...
  {
    "level": 1,
    "title": "Level 1 Crisis",
    "desc_for_teacher": "I notice a female student being rejected from advanced research opportunities.",
    "desc_for_student": "Someone suggests I should focus on more important things due to my gender.",
    "desc_for_guard": "An incident occurred in the research building that needs immediate attention.",
    "needs": { "support": 2, "policy": 1 },
    "tags": ["Gender"]
  },
  // ... 其余危机卡 ...
];
const actionCards = [
  // ... 只粘贴部分，实际请补全 ...
  {
    "type": "teacher",
    "title": "Gender Equity Policy",
    "effect": "Implement comprehensive gender equity policies",
    "effect_type": "policy",
    "tags": ["Gender"]
  },
  // ... 其余行动卡 ...
];
const ROLE_CARD_TYPES = {
  'Teacher': ['policy', 'teacher'],
  'Student': ['support', 'student'],
  'Guard': ['support', 'guard']
};

function dealHandForRole(role) {
  const types = ROLE_CARD_TYPES[role] || [];
  const pool = actionCards.filter(card => types.includes(card.type));
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export default function HomeClient() {
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState({});
  const [playerId, setPlayerId] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const dbRef = useRef(null);

  // 初始化Firebase和监听
  useEffect(() => {
    if (!dbRef.current) {
      const app = initializeApp(firebaseConfig);
      dbRef.current = getDatabase(app);
    }
    const db = dbRef.current;

    // 生成玩家ID
    const newPlayerId = String(Math.floor(Math.random() * 9000) + 1000);
    setPlayerId(newPlayerId);

    // 监听全局游戏状态
    const gameStateRef = ref(db, 'gameState');
    onValue(gameStateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameState(data);
    });

    // 监听所有玩家
    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setPlayers(data);
      if (newPlayerId && data[newPlayerId]) setMyPlayer(data[newPlayerId]);
    });

    // 添加玩家
    const newPlayerRef = ref(db, `players/${newPlayerId}`);
    set(newPlayerRef, {
      id: newPlayerId,
      hand: [],
      role: '',
      has_played_this_turn: false,
      lastSeen: serverTimestamp()
    });

    // 清理函数
    return () => {
      remove(newPlayerRef);
    };
  }, []);

  // 自动分配角色和发牌（仅第一个玩家负责）
  useEffect(() => {
    if (!gameState || !players || Object.keys(players).length < 3) return;
    if (gameState.started) return;
    // 只让第一个玩家分配角色和发牌，避免多次触发
    const firstPlayerId = Object.keys(players)[0];
    if (playerId !== firstPlayerId) return;
    const db = dbRef.current;
    // 分配角色
    const roles = [...AVAILABLE_ROLES].sort(() => Math.random() - 0.5);
    const updates = {};
    Object.values(players).forEach((p, idx) => {
      updates[`players/${p.id}/role`] = roles[idx];
      updates[`players/${p.id}/hand`] = dealHandForRole(roles[idx]);
      updates[`players/${p.id}/has_played_this_turn`] = false;
    });
    // 初始化游戏状态
    updates['gameState/started'] = true;
    updates['gameState/pressure'] = 0;
    updates['gameState/max_pressure'] = 10;
    updates['gameState/active_crises'] = [crisisCards[Math.floor(Math.random() * crisisCards.length)]];
    updates['gameState/current_player'] = Object.values(players)[0].id;
    updates['gameState/failed'] = false;
    set(ref(db), updates);
  }, [gameState, players, playerId]);

  // 出牌逻辑
  function playCard(cardIndex) {
    if (!myPlayer || !gameState || !myPlayer.hand || myPlayer.hand.length === 0) return;
    const db = dbRef.current;
    const hand = [...myPlayer.hand];
    const card = hand[cardIndex];
    hand.splice(cardIndex, 1);
    // 危机处理
    const crisis = gameState.active_crises[0];
    if (card && crisis) {
      if (card.effect_type === 'support' && crisis.needs.support > 0) {
        crisis.needs.support -= 1;
      } else if (card.effect_type === 'policy' && crisis.needs.policy > 0) {
        crisis.needs.policy -= 1;
      }
    }
    // 检查危机是否解决
    let active_crises = [...gameState.active_crises];
    if (crisis && crisis.needs.support === 0 && crisis.needs.policy === 0) {
      active_crises.shift();
      active_crises.push(crisisCards[Math.floor(Math.random() * crisisCards.length)]);
    }
    // 更新玩家手牌和全局状态
    update(ref(db), {
      [`players/${myPlayer.id}/hand`]: hand,
      [`players/${myPlayer.id}/has_played_this_turn`]: true,
      'gameState/active_crises': active_crises,
    });
  }

  return (
    <div>
      <h1>Truth Unlocked</h1>
      <div>Player ID: {playerId}</div>
      <div>
        <h2>手牌</h2>
        {(myPlayer?.hand || []).map((card, idx) => (
          <div key={idx} onClick={() => playCard(idx)} style={{cursor:'pointer',border:'1px solid #ccc',margin:'4px',padding:'4px'}}>
            {card.title} ({card.effect_type})
          </div>
        ))}
      </div>
      <div>
        <h2>当前危机</h2>
        {gameState?.active_crises?.map((crisis, idx) => (
          <div key={idx} style={{border:'1px solid #f00',margin:'4px',padding:'4px'}}>
            {crisis.title} | 支持:{crisis.needs?.support||0} 政策:{crisis.needs?.policy||0}
          </div>
        ))}
      </div>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
    </div>
  );
} 