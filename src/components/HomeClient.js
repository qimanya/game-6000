import { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, remove, push, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

const AVAILABLE_ROLES = ['Student', 'Teacher', 'Guard'];
const crisisCards = [
    {
        "level": 1,
        "title": "Level 1 Crisis",
        "desc_for_teacher": "I notice a female student being rejected from advanced research opportunities.",
        "desc_for_student": "Someone suggests I should focus on more important things due to my gender.",
        "desc_for_guard": "An incident occurred in the research building that needs immediate attention.",
        "needs": { "support": 2, "policy": 1 },
        "tags": ["Gender"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "I received multiple reports about inappropriate comments during class discussions.",
        "desc_for_student": "During group projects, I witnessed some behaviors that made me uncomfortable.",
        "desc_for_guard": "The situation in the classroom is deteriorating.",
        "needs": { "support": 2, "policy": 1 },
        "tags": ["Harassment"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "A faculty member has been accused.",
        "desc_for_student": "During private meetings, my advisor always tries to get too close to me.",
        "desc_for_guard": "The office, why are people still here at midnight.",
        "needs": { "support": 2, "policy": 2 },
        "tags": ["Harassment"]
    },
    {
        "level": 1,
        "title": "Level 1 Crisis",
        "desc_for_teacher": "Students report receiving inappropriate messages from classmates on social media.",
        "desc_for_student": "I received uncomfortable private messages and comments on my social media.",
        "desc_for_guard": "Online harassment incidents are increasing, need immediate attention.",
        "needs": { "support": 1, "policy": 1 },
        "tags": ["Digital", "Harassment"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "A student's academic performance has recently declined significantly.",
        "desc_for_student": "After witnessing and reporting harassment, I'm worried if I can pass this course.",
        "desc_for_guard": "A potential retaliation case has been discovered, needs immediate investigation.",
        "needs": { "support": 3, "policy": 1 },
        "tags": ["Harassment"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "I notice some students are consistently not allocated equipment.",
        "desc_for_student": "My equipment request was placed last again.",
        "desc_for_guard": "Resource allocation disputes in the lab need mediation.",
        "needs": { "policy": 2 },
        "tags": ["Gender"]
    },
    {
        "level": 1,
        "title": "Level 1 Crisis",
        "desc_for_teacher": "A male student in class seems to be called Anna.",
        "desc_for_student": "You can't come into the men's bathroom, get out, they pushed me violently.",
        "desc_for_guard": "There seems to be a violent incident in the school bathroom.",
        "needs": { "support": 2, "policy": 1 },
        "tags": ["Identity"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "I notice missing authorship and citations in papers.",
        "desc_for_student": "When can I publish my own paper?",
        "desc_for_guard": "There seems to be someone in the teaching building?!",
        "needs": { "support": 3 },
        "tags": ["Academic"]
    },
    {
        "level": 2,
        "title": "Level 2 Crisis",
        "desc_for_teacher": "A student from a small country transferred in, their emails always have many abbreviations.",
        "desc_for_student": "They say I smell strange, I feel excluded from group activities.",
        "desc_for_guard": "The classroom, why is someone wearing so many layers in summer.",
        "needs": { "support": 2 },
        "tags": ["Cultural"]
    },
    {
        "level": 1,
        "title": "Level 1 Crisis",
        "desc_for_teacher": "A student reports being followed and monitored.",
        "desc_for_student": "Everywhere I go, I always meet the same person.",
        "desc_for_guard": "Why are students still in pairs on campus at midnight, they must be good friends.",
        "needs": { "support": 2, "policy": 1 },
        "tags": ["Harassment"]
    },
    {
        "level": 1,
        "title": "Level 1 Crisis",
        "desc_for_teacher": "I notice students lack understanding of consent in academic settings.",
        "desc_for_student": "I'm not sure what behavior is appropriate.",
        "desc_for_guard": "There's a dispute in the classroom that needs handling.",
        "needs": { "support": 1, "policy": 2 },
        "tags": ["Harassment"]
    }
];
const actionCards = [
    { "type": "teacher", "title": "Gender Equity Policy", "effect": "Implement comprehensive gender equity policies", "effect_type": "policy", "tags": ["Gender"] },
    { "type": "teacher", "title": "Anti-Harassment Training", "effect": "Conduct mandatory anti-harassment training", "effect_type": "policy", "tags": ["Harassment"] },
    { "type": "teacher", "title": "Power Dynamics Training", "effect": "Implement training on appropriate faculty-student boundaries", "effect_type": "policy", "tags": ["Harassment"] },
    { "type": "teacher", "title": "Social Media Policy", "effect": "Establish guidelines for online interactions", "effect_type": "policy", "tags": ["Digital", "Harassment"] },
    { "type": "teacher", "title": "Anti-Retaliation Policy", "effect": "Implement measures to prevent retaliation", "effect_type": "policy", "tags": ["Harassment"] },
    { "type": "special", "title": "Title IX Review", "effect": "Convene Title IX compliance review", "effect_type": "support", "tags": ["General"] },
    { "type": "student", "title": "Peer Support Network", "effect": "Establish peer support system", "effect_type": "support", "tags": ["General"] },
    { "type": "student", "title": "Peer Support Hotline", "effect": "Establish confidential support system for victims", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "student", "title": "Digital Safety Workshop", "effect": "Provide training on online safety and privacy", "effect_type": "support", "tags": ["Digital", "Harassment"] },
    { "type": "student", "title": "Advocacy Network", "effect": "Create student-led support network", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "teacher", "title": "Academic Equity Review", "effect": "Review academic policies for equity", "effect_type": "policy", "tags": ["Academic"] },
    { "type": "teacher", "title": "Inclusive Language Policy", "effect": "Implement inclusive language guidelines", "effect_type": "policy", "tags": ["Identity"] },
    { "type": "teacher", "title": "Cultural Competency Training", "effect": "Provide cultural competency education", "effect_type": "policy", "tags": ["Cultural"] },
    { "type": "guard", "title": "Safe Space Initiative", "effect": "Create designated safe spaces", "effect_type": "support", "tags": ["General"] },
    { "type": "guard", "title": "Investigation Protocol", "effect": "Implement thorough investigation procedures", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "guard", "title": "Digital Evidence Collection", "effect": "Establish procedures for handling digital evidence", "effect_type": "support", "tags": ["Digital", "Harassment"] },
    { "type": "guard", "title": "Retaliation Prevention", "effect": "Monitor and prevent potential retaliation", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "student", "title": "Student Advocacy", "effect": "Organize student advocacy group", "effect_type": "support", "tags": ["General"] },
    { "type": "student", "title": "Cultural Exchange", "effect": "Promote cross-cultural understanding", "effect_type": "support", "tags": ["Cultural"] },
    { "type": "teacher", "title": "Faculty Training", "effect": "Conduct faculty equity training", "effect_type": "policy", "tags": ["General"] },
    { "type": "teacher", "title": "Resource Allocation Policy", "effect": "Implement fair resource distribution", "effect_type": "policy", "tags": ["Gender"] },
    { "type": "teacher", "title": "Inclusive Curriculum", "effect": "Develop inclusive curriculum guidelines", "effect_type": "policy", "tags": ["Cultural"] },
    { "type": "teacher", "title": "Anonymous Reporting", "effect": "Establish anonymous reporting system", "effect_type": "policy", "tags": ["Academic"] },
    { "type": "student", "title": "Inclusive Dialogue", "effect": "Facilitate open discussions", "effect_type": "support", "tags": ["Identity"] },
    { "type": "student", "title": "Academic Support", "effect": "Provide academic assistance", "effect_type": "support", "tags": ["Academic"] },
    { "type": "student", "title": "Cultural Awareness", "effect": "Promote cultural understanding", "effect_type": "support", "tags": ["Cultural"] },
    { "type": "guard", "title": "Campus Safety", "effect": "Enhance campus security measures", "effect_type": "support", "tags": ["General"] },
    { "type": "guard", "title": "Conflict Resolution", "effect": "Mediate conflicts effectively", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "guard", "title": "Digital Safety", "effect": "Monitor online harassment", "effect_type": "support", "tags": ["Digital"] },
    { "type": "guard", "title": "Emergency Response", "effect": "Implement emergency protocols", "effect_type": "support", "tags": ["Violence"] },
    { "type": "guard", "title": "Safe Reporting", "effect": "Ensure secure reporting process", "effect_type": "support", "tags": ["Identity"] },
    { "type": "guard", "title": "Prevention Training", "effect": "Conduct prevention workshops", "effect_type": "support", "tags": ["General"] },
    { "type": "guard", "title": "Online Protection", "effect": "Implement digital safety measures", "effect_type": "support", "tags": ["Digital"] },
    { "type": "guard", "title": "Mental Health Support", "effect": "Provide mental health resources", "effect_type": "support", "tags": ["MentalHealth"] },
    { "type": "teacher", "title": "Classroom Conduct Policy", "effect": "Establish clear guidelines for classroom behavior", "effect_type": "policy", "tags": ["Harassment"] },
    { "type": "teacher", "title": "Consent Education Program", "effect": "Implement comprehensive consent education", "effect_type": "policy", "tags": ["Harassment"] },
    { "type": "teacher", "title": "Visitor Management Policy", "effect": "Establish guidelines for campus visitors", "effect_type": "policy", "tags": ["Harassment"] },
    { "type": "student", "title": "Bystander Intervention Training", "effect": "Train students to safely intervene in harassment situations", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "student", "title": "Safe Walk Program", "effect": "Establish campus escort service", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "student", "title": "Consent Workshop", "effect": "Organize student-led consent education", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "guard", "title": "Campus Access Control", "effect": "Implement visitor tracking system", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "guard", "title": "Stalking Prevention", "effect": "Establish stalking response protocol", "effect_type": "support", "tags": ["Harassment"] },
    { "type": "guard", "title": "Environmental Assessment", "effect": "Conduct campus safety audit", "effect_type": "support", "tags": ["Harassment"] }
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

  useEffect(() => {
    if (!dbRef.current) {
      const app = initializeApp(firebaseConfig);
      dbRef.current = getDatabase(app);
    }
    const db = dbRef.current;

    const newPlayerId = String(Math.floor(Math.random() * 9000) + 1000);
    setPlayerId(newPlayerId);

    const gameStateRef = ref(db, 'gameState');
    onValue(gameStateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameState(data);
    });

    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setPlayers(data);
      if (newPlayerId && data[newPlayerId]) setMyPlayer(data[newPlayerId]);
    });

    const newPlayerRef = ref(db, `players/${newPlayerId}`);
    set(newPlayerRef, {
      id: newPlayerId,
      hand: [],
      role: '',
      has_played_this_turn: false,
      lastSeen: serverTimestamp()
    });

    return () => {
      remove(newPlayerRef);
    };
  }, []);

  useEffect(() => {
    if (!gameState || !players || Object.keys(players).length < 3) return;
    if (gameState.started) return;
    const firstPlayerId = Object.keys(players)[0];
    if (playerId !== firstPlayerId) return;
    const db = dbRef.current;
    const roles = [...AVAILABLE_ROLES].sort(() => Math.random() - 0.5);
    const updates = {};
    Object.values(players).forEach((p, idx) => {
      updates[`players/${p.id}/role`] = roles[idx];
      updates[`players/${p.id}/hand`] = dealHandForRole(roles[idx]);
      updates[`players/${p.id}/has_played_this_turn`] = false;
    });
    updates['gameState/started'] = true;
    updates['gameState/pressure'] = 0;
    updates['gameState/max_pressure'] = 10;
    updates['gameState/active_crises'] = [crisisCards[Math.floor(Math.random() * crisisCards.length)]];
    updates['gameState/current_player'] = Object.values(players)[0].id;
    updates['gameState/failed'] = false;
    set(ref(db), updates);
  }, [gameState, players, playerId]);

  function playCard(cardIndex) {
    if (!myPlayer || !gameState || !myPlayer.hand || myPlayer.hand.length === 0) return;
    const db = dbRef.current;
    const hand = [...myPlayer.hand];
    const card = hand[cardIndex];
    hand.splice(cardIndex, 1);
    const crisis = gameState.active_crises[0];
    if (card && crisis) {
      if (card.effect_type === 'support' && crisis.needs.support > 0) {
        crisis.needs.support -= 1;
      } else if (card.effect_type === 'policy' && crisis.needs.policy > 0) {
        crisis.needs.policy -= 1;
      }
    }
    let active_crises = [...gameState.active_crises];
    if (crisis && crisis.needs.support === 0 && crisis.needs.policy === 0) {
      active_crises.shift();
      active_crises.push(crisisCards[Math.floor(Math.random() * crisisCards.length)]);
    }
    update(ref(db), {
      [`players/${myPlayer.id}/hand`]: hand,
      [`players/${myPlayer.id}/has_played_this_turn`]: true,
      'gameState/active_crises': active_crises,
    });
  }

  if (!gameState || !myPlayer) return <div>加载中...</div>;

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