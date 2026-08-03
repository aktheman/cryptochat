window.__SOCKET = null;
window.__SOCKET_CONNECTED = false;
window.__SOCKET_RETRIES = 0;

function initSocketIO() {
  if (window.__SOCKET) return;
  if (typeof io === 'undefined') {
    window.__SOCKET_RETRIES++;
    if (window.__SOCKET_RETRIES > 30) return;
    setTimeout(initSocketIO, 500);
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    window.__SOCKET_CONNECTED = true;
  });

  socket.on('disconnect', () => {
    window.__SOCKET_CONNECTED = false;
  });

  socket.on('new_message', (data) => {
    if (window.__onNewMessage) window.__onNewMessage(data);
  });

  socket.on('typing', (data) => {
    if (window.__onTyping) window.__onTyping(data);
  });

  socket.on('incoming_call', (data) => {
    if (window.__onIncomingCall) window.__onIncomingCall(data);
  });

  socket.on('presence_update', (data) => {
    if (window.__onPresenceUpdate) window.__onPresenceUpdate(data);
  });

  socket.on('reminder', (data) => {
    if (window.__onReminder) window.__onReminder(data);
  });

  socket.on('digest', (data) => {
    if (window.__onDigest) window.__onDigest(data);
  });

  socket.on('broadcast', (data) => {
    if (window.__onBroadcast) window.__onBroadcast(data);
  });

  window.__SOCKET = socket;
}

function socketSendTyping(target, isTyping) {
  const socket = window.__SOCKET;
  if (socket && window.__SOCKET_CONNECTED) {
    socket.emit('typing', { target, isTyping });
  }
}

function socketSendCallSignal(target, type, payload) {
  const socket = window.__SOCKET;
  if (socket && window.__SOCKET_CONNECTED) {
    socket.emit('call_signal', { target, type, payload });
  }
}

function socketSendPresence(status, users) {
  const socket = window.__SOCKET;
  if (socket && window.__SOCKET_CONNECTED) {
    socket.emit('presence', { status, users });
  }
}

document.addEventListener('DOMContentLoaded', initSocketIO);
