// Socket.IO Connection
let socket = null;
let statusCallbacks = [];
let alertCallbacks = [];

function initializeSocket() {
    if (socket) {
        socket.disconnect();
    }
    
    socket = io(CONFIG.SOCKET_URL, {
        transports: ['websocket']
    });
    
    socket.on('connect', () => {
        console.log('Socket connected');
    });
    
    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
    
    socket.on('status', (data) => {
        console.log('Status update:', data);
        statusCallbacks.forEach(callback => callback(data));
    });
    
    socket.on('alert', (data) => {
        console.log('Alert received:', data);
        alertCallbacks.forEach(callback => callback(data));
    });
}

function subscribeToBike(bikeId) {
    if (socket && socket.connected) {
        socket.emit('subscribeBike', bikeId);
        console.log(`Subscribed to bike: ${bikeId}`);
    }
}

function onStatusUpdate(callback) {
    statusCallbacks.push(callback);
}

function onAlert(callback) {
    alertCallbacks.push(callback);
}

function clearSocketCallbacks() {
    statusCallbacks = [];
    alertCallbacks = [];
}

function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    clearSocketCallbacks();
}
