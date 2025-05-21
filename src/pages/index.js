import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, remove } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

let app, db;
if (typeof window !== 'undefined') {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
}

export default function Home() {
    // 游戏状态
    const [gameState, setGameState] = useState({
        pressure: 0,
        max_pressure: 10,
        active_crises: [],
        current_player: 1,
        players: [],
        started: false,
        failed: false,
        used_crisis_cards: []
    });

    const [playerId, setPlayerId] = useState(null);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [error, setError] = useState(null);
    const [roleInfo, setRoleInfo] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showGameOver, setShowGameOver] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [lastPingTime, setLastPingTime] = useState(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !db) return;
        // 生成玩家ID
        const newPlayerId = String(Math.floor(Math.random() * 9000) + 1000);
        setPlayerId(newPlayerId);

        // 监听游戏状态
        const gameStateRef = ref(db, 'gameState');
        onValue(gameStateRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(data);
                setConnectionStatus('Connected');
                setError(null);
            }
        }, (error) => {
            console.error("Error fetching game state:", error);
            setConnectionStatus('Error');
            setError('无法连接到游戏服务器');
        });

        // 添加玩家
        const playersRef = ref(db, 'players');
        const newPlayerRef = push(playersRef);
        console.log('尝试写入玩家数据', newPlayerId);
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

    // 处理出牌
    const handlePlayCard = (cardIndex) => {
        if (gameState && !gameState.failed) {
            const gameStateRef = ref(db, 'gameState');
            const currentPlayer = gameState.players.find(p => p.id === playerId);
            if (currentPlayer) {
                const card = currentPlayer.hand[cardIndex];
                if (card) {
                    // 更新游戏状态
                    const newGameState = { ...gameState };
                    const crisis = newGameState.active_crises[0];
                    
                    if (card.effect_type === 'support') {
                        crisis.needs.support = Math.max(0, crisis.needs.support - 1);
                    } else if (card.effect_type === 'policy') {
                        crisis.needs.policy = Math.max(0, crisis.needs.policy - 1);
                    }

                    // 移除使用的卡牌
                    currentPlayer.hand.splice(cardIndex, 1);

                    // 检查危机是否解决
                    if (crisis.needs.support === 0 && crisis.needs.policy === 0) {
                        newGameState.active_crises.shift();
                        newGameState.pressure = Math.max(0, newGameState.pressure - 1);
                    }

                    set(gameStateRef, newGameState);
                }
            }
        }
    };

    const handleRestart = () => {
        // 实现重启游戏的逻辑
    };

    useEffect(() => {
        if (gameState?.failed) {
            setShowGameOver(true);
        }
    }, [gameState?.failed]);

    return (
        <div style={{ padding: '20px' }}>
            {showGameOver && (
                (() => {
                    // 获取当前玩家角色
                    const myRole = gameState?.players.find(p => p.id === playerId)?.role;
                    const ending = ENDINGS[myRole] || {
                        title: 'System Collapse',
                        quote: '',
                        narrative: 'You failed to save the campus crisis.\nPressure has reached maximum, system has collapsed.',
                        keyline: ''
                    };
                    return (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000,
                            color: 'white',
                            textAlign: 'center',
                            padding: '20px'
                        }}>
                            <h1 style={{ 
                                fontSize: '3rem', 
                                marginBottom: '1.5rem',
                                color: '#ff4444'
                            }}>{ending.title}</h1>
                            {ending.quote && <h2 style={{ fontStyle: 'italic', marginBottom: '1.2rem', color: '#fff' }}>&ldquo;{ending.quote}&rdquo;</h2>}
                            <p style={{ 
                                fontSize: '1.2rem', 
                                marginBottom: '2rem',
                                maxWidth: '600px',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-line'
                            }}>{ending.narrative}</p>
                            {ending.keyline && <div style={{ fontWeight: 'bold', color: '#ffd700', fontSize: '1.1rem', marginBottom: '2.5rem' }}>&ldquo;{ending.keyline}&rdquo;</div>}
                            <button
                                onClick={handleRestart}
                                style={{
                                    padding: '15px 40px',
                                    fontSize: '1.2rem',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
                            >
                                Restart Game
                            </button>
                        </div>
                    );
                })()
            )}

            <h1>Truth Unlocked</h1>
            <div>
                <div style={{
                    padding: '10px',
                    marginBottom: '20px',
                    backgroundColor: connectionStatus === 'Connected' ? '#e8f5e9' : '#ffebee',
                    borderRadius: '4px',
                    border: `1px solid ${connectionStatus === 'Connected' ? '#4CAF50' : '#f44336'}`
                }}>
                    <p style={{ margin: '0' }}>
                        <strong>连接状态:</strong> {connectionStatus}
                        {isConnecting && ' (正在连接...)'}
                    </p>
                    {error && (
                        <p style={{ 
                            color: '#f44336', 
                            margin: '5px 0 0 0',
                            fontSize: '14px'
                        }}>
                            {error}
                        </p>
                    )}
                </div>
                <p>Player ID: {playerId || 'Not Assigned'}</p>
                {/* 移除顶部 Current Players 显示，只在等待页面显示 */}
                {/* <p>Current Players: {totalPlayers}/3</p> */}
                {/* Role Info Panel */}
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    padding: '20px',
                    minWidth: '280px',
                    maxWidth: '350px',
                    zIndex: 1000,
                    fontSize: '15px',
                    border: '1px solid #e0e0e0'
                }}>
                    {gameState?.started ? (
                        <>
                            <h3 style={{ 
                                margin: '0 0 10px 0',
                                color: '#333',
                                fontSize: '18px',
                                borderBottom: '2px solid #4CAF50',
                                paddingBottom: '8px'
                            }}>{gameState.players.find(p => p.id === playerId)?.role || 'Loading...'}</h3>
                            <div style={{ 
                                marginBottom: '15px',
                                color: '#666',
                                lineHeight: '1.5'
                            }}>{ROLE_DESCRIPTIONS[gameState.players.find(p => p.id === playerId)?.role]?.desc || 'Loading role description...'}</div>
                            <div style={{ 
                                background: '#f5f5f5',
                                padding: '12px',
                                borderRadius: '6px'
                            }}>
                                <h4 style={{ 
                                    margin: '0 0 8px 0',
                                    color: '#333',
                                    fontSize: '16px'
                                }}>Role Abilities:</h4>
                                <ul style={{ 
                                    margin: '0',
                                    padding: '0 0 0 20px',
                                    listStyleType: 'none'
                                }}>
                                    {ROLE_DESCRIPTIONS[gameState.players.find(p => p.id === playerId)?.role]?.abilities?.map((ability, index) => (
                                        <li key={index} style={{ 
                                            marginBottom: '8px',
                                            position: 'relative',
                                            paddingLeft: '20px',
                                            color: '#555'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                color: '#4CAF50'
                                            }}>•</span>
                                            {ability}
                                        </li>
                                    )) || <li>Loading abilities...</li>}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div style={{ 
                            color: '#666',
                            textAlign: 'center',
                            padding: '20px 0'
                        }}>
                            Waiting for game to start, roles will be assigned automatically...
                        </div>
                    )}
                </div>

                {!gameState?.started ? (
                    <div 
                        style={{ 
                            textAlign: 'center', 
                            padding: '40px',
                            minHeight: '100vh',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'url(/wait-bg.png) center center / cover no-repeat',
                        }}
                    >
                        {/* 半透明白色遮罩 */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(255,255,255,0.6)',
                            zIndex: 1
                        }} />
                        <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
                            <h2>Waiting for other players to join...</h2>
                            <div style={{ fontSize: '24px', margin: '20px 0' }}>
                                Current Players: {totalPlayers}/3
                            </div>
                        </div>
                    </div>
                ) : (
            <div>
                        <div style={{ margin: '20px 0' }}>
                            {gameState.players?.map((player, index) => (
                                <div key={index} style={{
                                    margin: '10px 0',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    backgroundColor: player.id === playerId ? '#e8f5e9' : '#f8f9fa'
                                }}>
                                    <strong>{player.role || 'Waiting for role...'}</strong>
                                    <span> Cards: {player.id === playerId ? player.hand?.length || 0 : '?'}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            height: '30px',
                            background: 'linear-gradient(to right, #4CAF50, #FFC107, #F44336)',
                            borderRadius: '15px',
                            margin: '20px 0',
                            position: 'relative'
                        }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '5px',
                                left: `${(gameState.pressure / gameState.max_pressure) * 100}%`,
                                transition: 'left 0.3s'
                            }} />
                        </div>
                        <div>Pressure: {gameState.pressure}/{gameState.max_pressure}</div>

                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            marginBottom: '30px',
                            flexWrap: 'wrap'
                        }}>
                            {gameState.active_crises.map((crisis, index) => (
                                <div key={index} style={{
                                    width: '400px',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    border: `3px solid ${
                                        crisis.level === 1 ? '#4CAF50' :
                                        crisis.level === 2 ? '#FFC107' : '#F44336'
                                    }`
                                }}>
                                    <h3>Level {crisis.level} Crisis</h3>
                                    <div><b>Teacher View:</b> {crisis.desc_for_teacher}</div>
                                    <div><b>Student View:</b> {crisis.desc_for_student}</div>
                                    <div><b>Guard View:</b> {crisis.desc_for_guard}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            marginTop: '30px',
                            flexWrap: 'wrap'
                        }}>
                            {gameState.players?.find(p => p.id === playerId)?.hand?.map((card, index) => (
                                <div key={index} style={{
                                    width: '150px',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    cursor: gameState.failed ? 'not-allowed' : 'pointer',
                                    opacity: gameState.failed ? 0.5 : 1,
                                    transition: 'transform 0.2s'
                                }}
                                onClick={() => !gameState.failed && handlePlayCard(index)}
                                onMouseOver={e => !gameState.failed && (e.currentTarget.style.transform = 'translateY(-5px)')}
                                onMouseOut={e => !gameState.failed && (e.currentTarget.style.transform = 'translateY(0)')}>
                                    <h4>{card.title}</h4>
                                    <p>{card.effect}</p>
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666',
                                        marginTop: '5px'
                                    }}>
                                        Type: {card.effect_type}
                                    </div>
                                </div>
                            )) || (
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px',
                                    color: '#666'
                                }}>
                                    Waiting for cards...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
