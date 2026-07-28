from flask import request, session
from flask_socketio import emit, join_room, leave_room, disconnect
from functools import wraps

def require_socket_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = session.get('username')
        if not username:
            disconnect()
            return
        return f(username, *args, **kwargs)
    return wrapper

def register_socket_handlers(socketio):

    @socketio.on('connect')
    @require_socket_auth
    def handle_connect(username):
        join_room(f'user:{username}')
        emit('connected', {'username': username})

    @socketio.on('disconnect')
    @require_socket_auth
    def handle_disconnect(username):
        pass

    @socketio.on('join')
    @require_socket_auth
    def handle_join(username, data):
        room = data.get('room')
        if room:
            join_room(room)

    @socketio.on('leave')
    @require_socket_auth
    def handle_leave(username, data):
        room = data.get('room')
        if room:
            leave_room(room)

    @socketio.on('typing')
    @require_socket_auth
    def handle_typing(username, data):
        target = data.get('target')
        chat_type = data.get('chatType', 'user')
        is_typing = data.get('isTyping', True)
        if target:
            room = f'user:{target}'
            emit('typing_notification', {
                'username': username,
                'chatType': chat_type,
                'isTyping': is_typing,
            }, room=room)

    @socketio.on('presence')
    @require_socket_auth
    def handle_presence(username, data):
        status = data.get('status', 'online')
        users = data.get('users', [])
        for user in users:
            emit('presence_update', {
                'username': username,
                'status': status,
            }, room=f'user:{user}')

    @socketio.on('call_signal')
    @require_socket_auth
    def handle_call_signal(username, data):
        target = data.get('target')
        signal_type = data.get('type')
        payload = data.get('payload', {})
        if target:
            room = f'user:{target}'
            emit('call_signal', {
                'from': username,
                'type': signal_type,
                'payload': payload,
            }, room=room)

def notify_user(socketio, username, event, data):
    socketio.emit(event, data, room=f'user:{username}')
