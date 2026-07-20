import os
import sys
import json
import pytest
import tempfile
import shutil
from pathlib import Path

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
secret_key_path = Path(__file__).resolve().parent.parent / 'tests' / 'test_secret.key'
if secret_key_path.exists():
    os.environ['SECRET_KEY_FILE'] = str(secret_key_path)
else:
    os.environ['SECRET_KEY'] = 'test-secret-key-for-testing'

from app import app
from app import RATE_LIMIT_STORE
from db import _get_conn, invalidate_cache


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SESSION_COOKIE_SECURE'] = False
    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def clean_data():
    invalidate_cache()
    conn = _get_conn()
    conn.execute('DELETE FROM kv_store')
    conn.commit()
    conn.close()
    RATE_LIMIT_STORE.clear()
    yield
    invalidate_cache()
    conn = _get_conn()
    conn.execute('DELETE FROM kv_store')
    conn.commit()
    conn.close()
    RATE_LIMIT_STORE.clear()


def _register(client, username, password='pass123'):
    return client.post('/auth/register', json={'username': username, 'password': password})


def _login(client, username, password='pass123'):
    return client.post('/auth/login', json={'username': username, 'password': password})


def _logout(client):
    return client.post('/auth/logout')


def _new_client():
    c = app.test_client()
    return c


def _setup_pair(client, username_a='alice', username_b='bob'):
    _register(client, username_a)
    client2 = _new_client()
    _register(client2, username_b)
    return client2


class TestHealth:
    def test_health(self, client):
        r = client.get('/health')
        assert r.status_code == 200
        assert r.get_json()['success'] is True


class TestAuth:
    def test_register_success(self, client):
        r = _register(client, 'alice')
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_register_short_username(self, client):
        r = client.post('/auth/register', json={'username': 'ab', 'password': 'pass123'})
        assert r.status_code == 400

    def test_register_short_password(self, client):
        r = client.post('/auth/register', json={'username': 'alice', 'password': '123'})
        assert r.status_code == 400

    def test_register_duplicate(self, client):
        _register(client, 'alice')
        r = _register(client, 'alice')
        assert r.status_code == 400

    def test_register_empty_fields(self, client):
        r = client.post('/auth/register', json={'username': '', 'password': ''})
        assert r.status_code == 400

    def test_login_success(self, client):
        _register(client, 'alice')
        _logout(client)
        r = _login(client, 'alice')
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_login_wrong_password(self, client):
        _register(client, 'alice')
        _logout(client)
        r = client.post('/auth/login', json={'username': 'alice', 'password': 'wrongpass'})
        assert r.status_code == 401

    def test_login_nonexistent_user(self, client):
        r = client.post('/auth/login', json={'username': 'nobody', 'password': 'pass123'})
        assert r.status_code == 401

    def test_logout(self, client):
        _register(client, 'alice')
        r = _logout(client)
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_unauthenticated_redirect(self, client):
        r = client.get('/chat')
        assert r.status_code in (302, 308)

    def test_2fa_enable_disable(self, client):
        _register(client, 'alice')
        r = client.post('/auth/2fa/enable')
        assert r.status_code == 200
        data = r.get_json()
        assert 'secret' in data
        r = client.post('/auth/2fa/disable')
        assert r.status_code == 200


class TestMessages:
    def test_send_message(self, client):
        client2 = _setup_pair(client)
        r = client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hello', 'type': 'text'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_get_messages(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hello', 'type': 'text'})
        r = client.get('/messages/bob')
        assert r.status_code == 200
        assert len(r.get_json()['messages']) == 1

    def test_get_messages_empty(self, client):
        _register(client, 'alice')
        r = client.get('/messages/bob')
        assert r.status_code == 200
        assert r.get_json()['messages'] == []

    def test_send_missing_fields(self, client):
        _register(client, 'alice')
        r = client.post('/send', json={})
        assert r.status_code == 400

    def test_send_no_recipient(self, client):
        _register(client, 'alice')
        r = client.post('/send', json={'ciphertext': 'hello'})
        assert r.status_code == 400

    def test_send_no_ciphertext(self, client):
        _register(client, 'alice')
        r = client.post('/send', json={'recipient': 'bob'})
        assert r.status_code == 400

    def test_unauthenticated_send(self, client):
        r = client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hi'})
        assert r.status_code == 401

    def test_unauthenticated_get_messages(self, client):
        r = client.get('/messages/bob')
        assert r.status_code == 401

    def test_edit_message(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'original', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        msg_id = msgs[0]['id']
        r = client.put(f'/messages/{msg_id}/edit', json={'ciphertext': 'edited'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_edit_message_not_found(self, client):
        _register(client, 'alice')
        r = client.put('/messages/nonexistent/edit', json={'ciphertext': 'edited'})
        assert r.status_code == 404

    def test_edit_message_empty_content(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'original', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        msg_id = msgs[0]['id']
        r = client.put(f'/messages/{msg_id}/edit', json={'ciphertext': ''})
        assert r.status_code == 400

    def test_delete_message(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'delete me', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        msg_id = msgs[0]['id']
        r = client.delete(f'/messages/{msg_id}')
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_delete_message_not_found(self, client):
        _register(client, 'alice')
        r = client.delete('/messages/nonexistent')
        assert r.status_code == 404

    def test_multiple_messages_order(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'first', 'type': 'text'})
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'second', 'type': 'text'})
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'third', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        assert len(msgs) == 3
        assert msgs[0]['text'] == 'first'
        assert msgs[2]['text'] == 'third'

    def test_read_receipts(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hello', 'type': 'text'})
        r = client2.post('/read_receipts/alice')
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_search_messages(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'searchable', 'type': 'text'})
        r = client.get('/search?q=searchable&partner=bob')
        assert r.status_code == 200


class TestReactions:
    def test_add_reaction(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'test', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        msg_id = msgs[0]['id']
        r = client.post('/reactions', json={'message_id': msg_id, 'emoji': '\U0001f44d'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_toggle_reaction(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'test', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        msg_id = msgs[0]['id']
        client.post('/reactions', json={'message_id': msg_id, 'emoji': '\U0001f44d'})
        r = client.post('/reactions', json={'message_id': msg_id, 'emoji': '\U0001f44d'})
        assert r.get_json()['reactions'] == {}

    def test_get_reactions(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'test', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        msg_id = msgs[0]['id']
        client.post('/reactions', json={'message_id': msg_id, 'emoji': '\U0001f44d'})
        r = client.get(f'/reactions/{msg_id}')
        assert r.status_code == 200
        assert 'alice' in r.get_json()['reactions']

    def test_reaction_missing_fields(self, client):
        _register(client, 'alice')
        r = client.post('/reactions', json={})
        assert r.status_code == 400


class TestTyping:
    def test_typing_indicator(self, client):
        _register(client, 'alice')
        r = client.post('/typing', json={'target': 'bob', 'typing': True})
        assert r.status_code == 200
        r = client.get('/typing/alice')
        assert r.status_code == 200

    def test_typing_stop(self, client):
        _register(client, 'alice')
        client.post('/typing', json={'target': 'bob', 'typing': True})
        r = client.post('/typing', json={'target': 'bob', 'typing': False})
        assert r.status_code == 200

    def test_typing_missing_target(self, client):
        _register(client, 'alice')
        r = client.post('/typing', json={'typing': True})
        assert r.status_code == 400


class TestGroups:
    def test_create_group(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'Test', 'members': []})
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_create_group_with_members(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        r = client.post('/groups', json={'name': 'Test', 'members': ['bob']})
        assert r.status_code == 200
        assert 'bob' in r.get_json()['group']['members']

    def test_create_group_empty_name(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': '', 'members': []})
        assert r.status_code == 400

    def test_list_groups(self, client):
        _register(client, 'alice')
        client.post('/groups', json={'name': 'Test', 'members': []})
        r = client.get('/groups')
        assert r.status_code == 200
        assert len(r.get_json()['groups']) == 1

    def test_list_groups_empty(self, client):
        _register(client, 'alice')
        r = client.get('/groups')
        assert r.status_code == 200
        assert len(r.get_json()['groups']) == 0

    def test_send_group_message(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'Test', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.post(f'/groups/{gid}/send', json={'ciphertext': 'hello group', 'type': 'text'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_send_group_message_empty(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'Test', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.post(f'/groups/{gid}/send', json={'ciphertext': '', 'type': 'text'})
        assert r.status_code == 400

    def test_get_group_messages(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'Test', 'members': []})
        gid = r.get_json()['group']['id']
        client.post(f'/groups/{gid}/send', json={'ciphertext': 'hello', 'type': 'text'})
        r = client.get(f'/groups/{gid}/messages')
        assert r.status_code == 200
        assert len(r.get_json()['messages']) == 1

    def test_delete_group(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'Test', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.delete(f'/groups/{gid}')
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_delete_group_not_found(self, client):
        _register(client, 'alice')
        r = client.delete('/groups/nonexistent')
        assert r.status_code == 404


class TestProfile:
    def test_get_profile(self, client):
        _register(client, 'alice')
        r = client.get('/profile')
        assert r.status_code == 200
        assert r.get_json()['username'] == 'alice'

    def test_update_profile(self, client):
        _register(client, 'alice')
        r = client.post('/profile', json={'display_name': 'Alice S', 'bio': 'Hello'})
        assert r.status_code == 200
        r = client.get('/profile')
        assert r.get_json()['display_name'] == 'Alice S'

    def test_unauthenticated_profile(self, client):
        r = client.get('/profile')
        assert r.status_code == 401


class TestCalls:
    def test_init_call(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        r = client.post('/calls/init', json={'target': 'bob', 'type': 'video'})
        assert r.status_code == 200
        assert 'call_id' in r.get_json()

    def test_init_call_missing_target(self, client):
        _register(client, 'alice')
        r = client.post('/calls/init', json={'type': 'video'})
        assert r.status_code == 400

    def test_hangup(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        r = client.post('/calls/init', json={'target': 'bob', 'type': 'audio'})
        cid = r.get_json()['call_id']
        r = client.post('/calls/hangup', json={'call_id': cid})
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_hangup_missing_call_id(self, client):
        _register(client, 'alice')
        r = client.post('/calls/hangup', json={})
        assert r.status_code == 400

    def test_incoming_call(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        client.post('/calls/init', json={'target': 'bob', 'type': 'video'})
        r = client2.get('/calls/incoming')
        assert r.status_code == 200
        data = r.get_json()
        assert data['call'] is not None
        assert data['call']['caller'] == 'alice'

    def test_no_incoming_call(self, client):
        _register(client, 'alice')
        r = client.get('/calls/incoming')
        assert r.status_code == 200
        assert r.get_json()['call'] is None

    def test_accept_call(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        r = client.post('/calls/init', json={'target': 'bob', 'type': 'video'})
        cid = r.get_json()['call_id']
        r = client2.post('/calls/accept', json={'call_id': cid, 'sdp': 'fake-sdp'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True

    def test_call_status(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        r = client.post('/calls/init', json={'target': 'bob', 'type': 'video'})
        cid = r.get_json()['call_id']
        r = client.get(f'/calls/status/{cid}')
        assert r.status_code == 200
        assert r.get_json()['status'] == 'ringing'

    def test_duplicate_call_rejected(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        client.post('/calls/init', json={'target': 'bob', 'type': 'video'})
        r = client.post('/calls/init', json={'target': 'bob', 'type': 'video'})
        assert r.status_code == 409


class TestSecurityHeaders:
    def test_headers_present(self, client):
        r = client.get('/health')
        assert r.headers.get('X-Content-Type-Options') == 'nosniff'
        assert r.headers.get('X-Frame-Options') == 'DENY'

    def test_cache_control(self, client):
        r = client.get('/health')
        assert 'no-store' in r.headers.get('Cache-Control', '')

    def test_xss_protection(self, client):
        r = client.get('/health')
        assert '1; mode=block' in r.headers.get('X-XSS-Protection', '')


class TestUsers:
    def test_list_users(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        r = client.get('/users')
        assert r.status_code == 200
        users = r.get_json()['users']
        assert len(users) == 1
        assert users[0]['username'] == 'bob'

    def test_list_users_unauthenticated(self, client):
        r = client.get('/users')
        assert r.status_code == 401

    def test_list_users_with_profiles(self, client):
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        r = client.get('/users/all')
        assert r.status_code == 200
        users = r.get_json()['users']
        assert len(users) == 1


class TestTheme:
    def test_get_theme(self, client):
        _register(client, 'alice')
        r = client.get('/theme')
        assert r.status_code == 200
        assert r.get_json()['theme'] == 'dark'

    def test_set_theme(self, client):
        _register(client, 'alice')
        r = client.post('/theme', json={'theme': 'light'})
        assert r.status_code == 200
        r = client.get('/theme')
        assert r.get_json()['theme'] == 'light'


class TestNotifications:
    def test_get_notifications(self, client):
        _register(client, 'alice')
        r = client.get('/notifications')
        assert r.status_code == 200
        assert r.get_json()['notifications'] == []


class TestServiceWorker:
    def test_manifest(self, client):
        r = client.get('/manifest.json')
        assert r.status_code == 200
        data = r.get_json()
        assert data['name'] == 'CryptoChat'

    def test_sw_js(self, client):
        r = client.get('/sw.js')
        assert r.status_code == 200
        assert 'application/javascript' in r.content_type
