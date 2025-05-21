// Socket.IO配置
const SOCKET_URL = 'https://truth-unlocked-server.onrender.com';  // 更改为你的服务器地址
const socket = io(SOCKET_URL, {
    path: '/api/socket',
    addTrailingSlash: false,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    forceNew: true,
    withCredentials: true,
    extraHeaders: {
        "Access-Control-Allow-Origin": "*"
    }
});

// 添加连接状态监听
socket.on("connect_error", (err) => {
    console.error("Connection error:", err);
    updateConnectionStatus('Connection Error');
    error = `连接错误: ${err.message || '无法连接到服务器'}`;
    isConnecting = false;
    reconnectAttempts++;
    handleReconnect();
});

socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
    updateConnectionStatus('Connected');
    error = null;
    isConnecting = false;
    reconnectAttempts = 0;
    lastPingTime = Date.now();
}); 