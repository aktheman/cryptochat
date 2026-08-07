import os
import sys
import json
import pytest
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
test_data_dir = tempfile.mkdtemp(prefix='cryptochat-test-data-')
os.environ['CRYPTOCHAT_DATA_DIR'] = test_data_dir
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
    app.config['CSRF_ENABLED'] = False
    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def clean_data():
    invalidate_cache()
    conn = _get_conn()
    conn.execute('DELETE FROM kv_store')
    conn.execute('DELETE FROM json_store')
    conn.commit()
    conn.close()
    RATE_LIMIT_STORE.clear()
    dict_files = {
        'users.json', 'keys.json', 'notifications.json', 'presence.json',
        'read_receipts.json', 'sessions.json', 'reactions.json', 'typing.json',
        'verification.json', 'calls.json', 'pins.json', 'push_subscriptions.json',
        'link_previews.json', 'pinned_chats.json', 'invite_links.json',
        'muted_chats.json', 'contacts.json', 'stories.json', 'blocked_users.json',
        'deleted_for_me.json', 'live_locations.json', 'wallpapers.json',
        'slowmode.json', 'drafts.json', 'polls.json', 'folders.json',
        'archive.json', 'quiet_hours.json', 'digest.json', 'key_backups.json',
    }
    for path in [
        app.users_file, app.messages_file, app.keys_file, app.groups_file,
        app.notifications_file, app.presence_file, app.read_receipts_file,
        app.sessions_file, app.reactions_file, app.typing_file, app.verification_file,
        app.calls_file, app.pins_file, app.scheduled_file, app.drafts_file,
        app.push_subscriptions_file, app.link_previews_file, app.pinned_chats_file,
        app.folders_file, app.channels_file, app.invite_links_file,
        app.muted_chats_file, app.contacts_file, app.stories_file,
        app.blocked_file, app.deleted_for_me_file, app.live_location_file,
        app.wallpapers_file, app.slowmode_file, app.polls_file,
        app.archive_file, app.reminders_file, app.quiet_hours_file,
        app.digest_file, app.key_backup_file,
    ]:
        path.write_text('{}' if path.name in dict_files else '[]', encoding='utf-8')
    yield
    invalidate_cache()
    conn = _get_conn()
    conn.execute('DELETE FROM kv_store')
    conn.execute('DELETE FROM json_store')
    conn.commit()
    conn.close()
    RATE_LIMIT_STORE.clear()


def _register(client, username, password='Passw0rd!23'):
    return client.post('/auth/register', json={'username': username, 'password': password})


def _login(client, username, password='Passw0rd!23'):
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

    def test_health_includes_db_status(self, client):
        r = client.get('/health')
        assert r.status_code == 200
        j = r.get_json()
        assert j['status'] == 'healthy'
        assert j['db'] == 'ok'
        assert j['version']


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
        r = client.post('/auth/login', json={'username': 'alice', 'password': 'Wrongpassword1!'})
        assert r.status_code == 401

    def test_login_nonexistent_user(self, client):
        r = client.post('/auth/login', json={'username': 'nobody', 'password': 'Wrongpassword1!'})
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


class TestE2ee:
    def test_encrypt_symmetric_roundtrip(self, client):
        from app import encrypt_symmetric, decrypt_symmetric
        import base64 as _b64
        import secrets as _secrets
        from cryptography.exceptions import InvalidTag
        key_b64 = _b64.b64encode(_secrets.token_bytes(32)).decode()
        plain = 'e2ee-secret-msg'
        packed = encrypt_symmetric(plain, key_b64)
        assert isinstance(packed, str)
        assert decrypt_symmetric(packed, key_b64) == plain
        with pytest.raises(InvalidTag):
            decrypt_symmetric(packed, _b64.b64encode(_secrets.token_bytes(32)).decode())

    def test_pair_key_generation_unique(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        _login(client, 'alice')
        r = client.get('/keys/bob')
        assert r.status_code == 200
        data = r.get_json()
        assert 'publicKey' in data or 'public_key' in data

    def test_audit_events_written(self, client):
        from app import app as a, AUDIT_LOG_FILE
        from db import invalidate_cache, _get_conn
        invalidate_cache()
        conn = _get_conn(); conn.execute('DELETE FROM kv_store'); conn.commit(); conn.close()
        if AUDIT_LOG_FILE.exists():
            AUDIT_LOG_FILE.unlink()
        _register(client, 'alice')
        r = client.post('/auth/login', json={'username': 'alice', 'password': 'Passw0rd!23'})
        assert r.status_code == 200
        r = client.post('/auth/logout')
        assert r.status_code == 200
        text = AUDIT_LOG_FILE.read_text(encoding='utf-8')
        assert 'registered' in text
        assert 'login_success' in text
        assert 'logout' in text
        _login(client, 'alice')
        r = client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hello', 'type': 'text'})
        assert r.status_code == 200
        text = AUDIT_LOG_FILE.read_text(encoding='utf-8')
        assert 'message_sent' in text
        msgs = client.get('/messages/bob').get_json()['messages']
        msg_id = msgs[0]['id']
        r = client.put(f'/messages/{msg_id}/edit', json={'ciphertext': 'edited'})
        assert r.status_code == 200
        text = AUDIT_LOG_FILE.read_text(encoding='utf-8')
        assert 'message_edited' in text
        r = client.delete(f'/messages/{msg_id}')
        assert r.status_code == 200
        text = AUDIT_LOG_FILE.read_text(encoding='utf-8')
        assert 'message_deleted' in text
        r = client.post('/groups', json={'name': 'team', 'members': []})
        assert r.status_code == 200
        text = AUDIT_LOG_FILE.read_text(encoding='utf-8')
        assert 'group_created' in text
        r = client.post('/key/publish', json={'publicKeyPem': 'pem'})
        assert r.status_code == 200
        text = AUDIT_LOG_FILE.read_text(encoding='utf-8')
        assert 'key_published' in text


class TestCsrf:
    def test_csrf_blocks_unknown_origin(self, client):
        _register(client, 'alice')
        _login(client, 'alice')
        app.config['CSRF_ENABLED'] = True
        app.config['CSRF_TRUSTED_ORIGINS'] = ['http://localhost:8080']
        try:
            r = client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hi', 'type': 'text'}, headers={'Origin': 'http://evil.example'})
            assert r.status_code == 400
            assert 'Ugyldig forespørselskilde' in r.get_json().get('message', '')
        finally:
            app.config['CSRF_ENABLED'] = False
            app.config['CSRF_TRUSTED_ORIGINS'] = []


class TestRecovery:
    def test_register_does_not_leak_recovery_codes(self, client):
        r = client.post('/auth/register', json={'username': 'alice', 'password': 'Passw0rd!23'})
        data = r.get_json()
        assert r.status_code == 200
        assert data['success'] is True
        assert 'recovery_codes' not in data

    def test_recovery_resets_password(self, client):
        r = client.post('/auth/register', json={'username': 'alice', 'password': 'Passw0rd!23'})
        r = client.post('/auth/recovery/generate', json={})
        assert r.status_code == 200
        codes = r.get_json()['recovery_codes']
        r = client.post('/auth/logout')
        assert r.status_code == 200

        r = client.post('/auth/recovery', json={
            'username': 'alice',
            'code': codes[0],
            'new_password': 'N3wP@ssw0rd!',
        })
        assert r.status_code == 200
        data = r.get_json()
        assert data['success'] is True
        assert data['codes_remaining'] == 4

        r = client.post('/auth/login', json={'username': 'alice', 'password': 'N3wP@ssw0rd!'})
        assert r.status_code == 200

    def test_recovery_code_single_use(self, client):
        r = client.post('/auth/register', json={'username': 'alice', 'password': 'Passw0rd!23'})
        r = client.post('/auth/recovery/generate', json={})
        assert r.status_code == 200
        codes = r.get_json()['recovery_codes']
        r = client.post('/auth/logout')

        r = client.post('/auth/recovery', json={
            'username': 'alice', 'code': codes[0], 'new_password': 'N3wP@ssw0rd!'
        })
        assert r.status_code == 200

        r = client.post('/auth/recovery', json={
            'username': 'alice', 'code': codes[0], 'new_password': 'N3wP@ssw0rd!'
        })
        assert r.status_code == 401
        assert 'Ugyldig' in r.get_json().get('message', '')

    def test_recovery_invalid_code(self, client):
        client.post('/auth/register', json={'username': 'alice', 'password': 'Passw0rd!23'})
        client.post('/auth/logout')
        r = client.post('/auth/recovery', json={
            'username': 'alice', 'code': '0000-0000', 'new_password': 'N3wP@ssw0rd!'
        })
        assert r.status_code == 401

    def test_recovery_invalidates_old_sessions(self, client):
        r = client.post('/auth/register', json={'username': 'alice', 'password': 'Passw0rd!23'})
        r = client.post('/auth/recovery/generate', json={})
        codes = r.get_json()['recovery_codes']

        r = client.get('/users')
        assert r.status_code == 200

        client.post('/auth/recovery', json={
            'username': 'alice', 'code': codes[0], 'new_password': 'N3wP@ssw0rd!'
        })

        r = client.get('/users')
        assert r.status_code in (401, 302)

    def test_regenerate_recovery_codes(self, client):
        r = client.post('/auth/register', json={'username': 'alice', 'password': 'Passw0rd!23'})
        r = client.post('/auth/recovery/generate', json={})
        assert r.status_code == 200
        codes1 = r.get_json()['recovery_codes']
        r = client.post('/auth/recovery/generate', json={})
        assert r.status_code == 200
        codes2 = r.get_json()['recovery_codes']
        assert codes2 != codes1
        assert len(codes2) == 5


class TestLastMessages:
    def test_last_messages_empty(self, client):
        _register(client, 'alice')
        _login(client, 'alice')
        r = client.get('/last-messages')
        assert r.status_code == 200
        data = r.get_json()
        assert data['success'] is True
        assert data['users'] == {}
        assert data['groups'] == {}

    def test_last_messages_returns_last_per_user(self, client):
        _register(client, 'alice')
        _login(client, 'alice')
        _register(client, 'bob')
        _login(client, 'alice')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'first', 'type': 'text'})
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'second', 'type': 'text'})
        r = client.get('/last-messages')
        data = r.get_json()
        assert 'bob' in data['users']
        assert 'second' in data['users']['bob']['text']

    def test_last_messages_unauthenticated(self, client):
        r = client.get('/last-messages')
        assert r.status_code == 401


class TestGroupMembership:
    def _create_group(self, client, name='g', members=None):
        r = client.post('/groups', json={'name': name, 'members': members or []})
        return r.get_json()['group']['id']

    def test_non_member_cannot_read_group_messages(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'secret', ['alice'])
        client.post(f'/groups/{group_id}/send', json={'ciphertext': 'hello', 'type': 'text'})
        client2 = _new_client()
        _register(client2, 'eve')
        r = client2.get(f'/groups/{group_id}/messages')
        assert r.status_code == 403

    def test_member_can_read_group_messages(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'chat', ['alice', 'bob'])
        client.post(f'/groups/{group_id}/send', json={'ciphertext': 'hello', 'type': 'text'})
        r = client.get(f'/groups/{group_id}/messages')
        assert r.status_code == 200
        assert len(r.get_json()['messages']) == 1


class TestDeleteGroupPermissions:
    def _create_group(self, client, name='g', members=None):
        r = client.post('/groups', json={'name': name, 'members': members or []})
        return r.get_json()['group']['id']

    def test_member_cannot_delete_group(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'g', ['alice'])
        client2 = _new_client()
        _register(client2, 'bob')
        client.post(f'/groups/{group_id}/members', json={'username': 'bob'})
        r = client2.delete(f'/groups/{group_id}')
        assert r.status_code == 403

    def test_creator_can_delete_group(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'g', ['alice'])
        r = client.delete(f'/groups/{group_id}')
        assert r.status_code == 200


class TestPinAuthorization:
    def _create_group(self, client, name='g', members=None):
        r = client.post('/groups', json={'name': name, 'members': members or []})
        return r.get_json()['group']['id']

    def test_non_member_cannot_pin_in_group(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'g', ['alice'])
        client.post(f'/groups/{group_id}/send', json={'ciphertext': 'hi', 'type': 'text'})
        msgs = client.get(f'/groups/{group_id}/messages').get_json()['messages']
        msg_id = msgs[0]['id']
        client2 = _new_client()
        _register(client2, 'eve')
        r = client2.post(f'/pins/group/{group_id}/{msg_id}')
        assert r.status_code == 403

    def test_member_can_pin_in_group(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'g', ['alice'])
        client.post(f'/groups/{group_id}/send', json={'ciphertext': 'hi', 'type': 'text'})
        msgs = client.get(f'/groups/{group_id}/messages').get_json()['messages']
        msg_id = msgs[0]['id']
        r = client.post(f'/pins/group/{group_id}/{msg_id}')
        assert r.status_code == 200

    def test_pins_simple_requires_auth(self, client):
        client2 = _new_client()
        r = client2.get('/pins/alice')
        assert r.status_code == 401

    def test_pins_simple_denies_non_member(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'g', ['alice'])
        client.post(f'/groups/{group_id}/send', json={'ciphertext': 'hi', 'type': 'text'})
        msgs = client.get(f'/groups/{group_id}/messages').get_json()['messages']
        msg_id = msgs[0]['id']
        client.post(f'/pins/group/{group_id}/{msg_id}')
        client2 = _new_client()
        _register(client2, 'eve')
        r = client2.get(f'/pins/{group_id}')
        assert r.status_code == 403

    def test_pins_simple_returns_expected_format(self, client):
        _register(client, 'alice')
        group_id = self._create_group(client, 'g', ['alice'])
        client.post(f'/groups/{group_id}/send', json={'ciphertext': 'hi', 'type': 'text'})
        msgs = client.get(f'/groups/{group_id}/messages').get_json()['messages']
        msg_id = msgs[0]['id']
        client.post(f'/pins/group/{group_id}/{msg_id}')
        r = client.get(f'/pins/{group_id}')
        assert r.status_code == 200
        j = r.get_json()
        assert j['success'] is True
        assert len(j['pins']) == 1
        entry = j['pins'][0]
        assert entry['id'] == msg_id
        assert entry['sender'] == 'alice'
        assert entry['type'] == 'text'
        assert 'text' in entry

    def test_pins_simple_denies_nonexistent_user(self, client):
        _register(client, 'alice')
        r = client.get('/pins/ghost')
        assert r.status_code == 403


class TestAvatarAuth:
    def test_unauthenticated_cannot_get_avatar(self, client):
        _register(client, 'alice')
        client.post('/profile', json={'displayName': 'Alice', 'avatar': 'data:image/png;base64,abc'})
        client2 = _new_client()
        r = client2.get('/profile/avatar/alice')
        assert r.status_code == 401

    def test_authenticated_can_get_avatar(self, client):
        _register(client, 'alice')
        client.post('/profile', json={'displayName': 'Alice', 'avatar': 'data:image/png;base64,abc'})
        r = client.get('/profile/avatar/alice')
        assert r.status_code == 200


class TestLiveLocationOwnership:
    def test_non_owner_cannot_read_live_location(self, client):
        _register(client, 'alice')
        r = client.post('/location/live', json={'lat': 60.0, 'lng': 10.0, 'target': 'bob', 'targetType': 'user', 'duration': 60})
        share_id = r.get_json().get('shareId')
        client2 = _new_client()
        _register(client2, 'eve')
        r = client2.get(f'/location/live/{share_id}')
        assert r.status_code == 403

    def test_owner_can_read_live_location(self, client):
        _register(client, 'alice')
        r = client.post('/location/live', json={'lat': 60.0, 'lng': 10.0, 'target': 'bob', 'targetType': 'user', 'duration': 60})
        share_id = r.get_json().get('shareId')
        r = client.get(f'/location/live/{share_id}')
        assert r.status_code == 200


class TestExportChatGroups:
    def test_export_group_chat_uses_group_id(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': ['alice']})
        group_id = r.get_json()['group']['id']
        client.post(f'/groups/{group_id}/send', json={'ciphertext': 'hello world', 'type': 'text'})
        r = client.get(f'/export/group/{group_id}')
        assert r.status_code == 200
        assert 'text/plain' in r.content_type
        assert b'hello world' in r.data


class TestSendLocationValidation:
    def test_send_location_invalid_coords(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        r = client.post('/send/location', json={'recipient': 'bob', 'lat': 'not_a_number', 'lng': 10.0})
        assert r.status_code == 400

    def test_send_location_valid_coords(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        r = client.post('/send/location', json={'recipient': 'bob', 'lat': 60.5, 'lng': 10.5})
        assert r.status_code == 200


class TestCsrfProtection:
    def test_csrf_blocks_mutation_without_origin(self, client):
        app.config['CSRF_ENABLED'] = True
        app.config['CSRF_TRUSTED_ORIGINS'] = ['http://localhost:5000']
        try:
            _register(client, 'alice')
            _login(client, 'alice')
            r = client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hi', 'type': 'text'}, headers={'Origin': 'http://evil.example'})
            assert r.status_code == 400
        finally:
            app.config['CSRF_ENABLED'] = False
            app.config['CSRF_TRUSTED_ORIGINS'] = []

    def test_csrf_allows_trusted_origin(self, client):
        app.config['CSRF_ENABLED'] = True
        app.config['CSRF_TRUSTED_ORIGINS'] = ['http://localhost:5000']
        try:
            _register(client, 'alice')
            _login(client, 'alice')
            r = client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hi', 'type': 'text'}, headers={'Origin': 'http://localhost:5000'})
            assert r.status_code == 200
        finally:
            app.config['CSRF_ENABLED'] = False
            app.config['CSRF_TRUSTED_ORIGINS'] = []

    def test_csrf_allows_no_origin(self, client):
        app.config['CSRF_ENABLED'] = True
        app.config['CSRF_TRUSTED_ORIGINS'] = ['http://localhost:5000']
        try:
            _register(client, 'alice')
            _login(client, 'alice')
            r = client.post('/send', json={'recipient': 'bob', 'ciphertext': 'hi', 'type': 'text'})
            assert r.status_code == 200
        finally:
            app.config['CSRF_ENABLED'] = False
            app.config['CSRF_TRUSTED_ORIGINS'] = []


class TestChannels:
    def test_create_channel(self, client):
        _register(client, 'alice')
        r = client.post('/channels', json={'name': 'Nyheter', 'description': 'Viktige oppdateringer'})
        assert r.status_code == 200
        data = r.get_json()
        assert data['success'] is True
        assert data['channel']['name'] == 'Nyheter'

    def test_create_channel_no_name(self, client):
        _register(client, 'alice')
        r = client.post('/channels', json={'description': 'uten navn'})
        assert r.status_code == 400

    def test_list_channels(self, client):
        _register(client, 'alice')
        client.post('/channels', json={'name': 'Nyheter'})
        r = client.get('/channels')
        assert r.status_code == 200
        assert len(r.get_json()['channels']) == 1

    def test_send_channel_message(self, client):
        _register(client, 'alice')
        r = client.post('/channels', json={'name': 'Nyheter'})
        cid = r.get_json()['channel']['id']
        r = client.post(f'/channels/{cid}/send', json={'ciphertext': 'hello all', 'type': 'text'})
        assert r.status_code == 200

    def test_subscribe_unsubscribe(self, client):
        _register(client, 'alice')
        r = client.post('/channels', json={'name': 'Nyheter'})
        cid = r.get_json()['channel']['id']
        client2 = _new_client()
        _register(client2, 'bob')
        r = client2.post(f'/channels/{cid}/subscribe')
        assert r.status_code == 200
        r = client2.post(f'/channels/{cid}/unsubscribe')
        assert r.status_code == 200


class TestScheduledMessages:
    def test_schedule_message(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        r = client.post('/schedule', json={
            'recipient': 'bob',
            'ciphertext': 'hello future',
            'send_at': '2099-01-01T12:00:00Z',
        })
        assert r.status_code == 200
        assert 'id' in r.get_json()

    def test_schedule_past_time(self, client):
        _register(client, 'alice')
        r = client.post('/schedule', json={
            'recipient': 'bob',
            'ciphertext': 'too late',
            'send_at': '2020-01-01T12:00:00Z',
        })
        assert r.status_code == 400

    def test_schedule_list(self, client):
        _register(client, 'alice')
        client.post('/schedule', json={
            'recipient': 'bob', 'ciphertext': 'hi',
            'send_at': '2099-01-01T12:00:00Z',
        })
        r = client.get('/schedule')
        assert r.status_code == 200
        assert len(r.get_json()['scheduled']) == 1

    def test_cancel_scheduled(self, client):
        _register(client, 'alice')
        r = client.post('/schedule', json={
            'recipient': 'bob', 'ciphertext': 'hi',
            'send_at': '2099-01-01T12:00:00Z',
        })
        sid = r.get_json()['id']
        r = client.delete(f'/schedule/{sid}')
        assert r.status_code == 200
        r = client.get('/schedule')
        assert len(r.get_json()['scheduled']) == 0


class TestPinnedMessages:
    def test_pin_unpin_message(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'pin me', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        mid = msgs[0]['id']
        r = client.post(f'/pins/user/bob/{mid}')
        assert r.status_code == 200
        r = client.delete(f'/pins/user/bob/{mid}')
        assert r.status_code == 200


class TestWallpapers:
    def test_get_presets(self, client):
        _register(client, 'alice')
        r = client.get('/wallpapers')
        assert r.status_code == 200
        assert len(r.get_json()['presets']) > 0

    def test_set_wallpaper(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        r = client.post('/wallpaper/user/bob', json={'wallpaper_id': 'stars'})
        assert r.status_code == 200
        r = client.get('/wallpaper/user/bob')
        assert r.get_json()['wallpaper']['id'] == 'stars'


class TestContacts:
    def test_add_contact(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        r = client.post('/contacts', json={'username': 'bob', 'name': 'Bob B'})
        assert r.status_code == 200

    def test_add_contact_nonexistent(self, client):
        _register(client, 'alice')
        r = client.post('/contacts', json={'username': 'nonexistent'})
        assert r.status_code == 404

    def test_get_contacts(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/contacts', json={'username': 'bob'})
        r = client.get('/contacts')
        assert r.status_code == 200
        assert len(r.get_json()['contacts']) == 1

    def test_update_contact(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/contacts', json={'username': 'bob', 'name': 'Bob'})
        r = client.put('/contacts/bob', json={'name': 'Robert', 'notes': 'Min venn'})
        assert r.status_code == 200

    def test_remove_contact(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/contacts', json={'username': 'bob'})
        r = client.delete('/contacts/bob')
        assert r.status_code == 200


class TestArchive:
    def test_toggle_archive(self, client):
        _register(client, 'alice')
        r = client.post('/archive', json={'chatType': 'user', 'chatId': 'bob'})
        assert r.status_code == 200

    def test_get_archive(self, client):
        _register(client, 'alice')
        client.post('/archive', json={'chatType': 'user', 'chatId': 'bob'})
        r = client.get('/archive')
        assert r.status_code == 200
        assert len(r.get_json()['archive']) == 1


class TestFolders:
    def test_get_default_folders(self, client):
        _register(client, 'alice')
        r = client.get('/folders')
        assert r.status_code == 200
        assert len(r.get_json()['folders']) == 1

    def test_save_folders(self, client):
        _register(client, 'alice')
        folders = [{'id': 'work', 'name': 'Jobb', 'filters': ['bob']}]
        r = client.post('/folders', json={'folders': folders})
        assert r.status_code == 200
        r = client.get('/folders')
        assert r.get_json()['folders'] == folders


class TestBlockUser:
    def test_block_unblock(self, client):
        _register(client, 'alice')
        r = client.post('/block/bob')
        assert r.status_code == 200
        r = client.delete('/block/bob')
        assert r.status_code == 200

    def test_block_self(self, client):
        _register(client, 'alice')
        r = client.post('/block/alice')
        assert r.status_code == 400

    def test_blocked_list(self, client):
        _register(client, 'alice')
        client.post('/block/bob')
        r = client.get('/blocked')
        assert r.status_code == 200
        assert 'bob' in r.get_json()['blocked']

    def test_check_blocked(self, client):
        _register(client, 'alice')
        client.post('/block/bob')
        r = client.get('/blocked/check/bob')
        assert r.status_code == 200
        assert r.get_json()['iBlocked'] is True


class TestStories:
    def test_create_story(self, client):
        _register(client, 'alice')
        r = client.post('/stories', json={
            'content': 'Min første story!',
            'type': 'text',
            'bgColor': '#1c1030',
        })
        assert r.status_code == 200
        assert 'story' in r.get_json()

    def test_get_stories(self, client):
        _register(client, 'alice')
        client.post('/stories', json={'content': 'Hei', 'type': 'text'})
        r = client.get('/stories')
        assert r.status_code == 200
        assert len(r.get_json()['stories']) == 1

    def test_delete_story(self, client):
        _register(client, 'alice')
        r = client.post('/stories', json={'content': 'Hei', 'type': 'text'})
        sid = r.get_json()['story']['id']
        r = client.delete(f'/stories/{sid}')
        assert r.status_code == 200

    def test_view_story(self, client):
        _register(client, 'alice')
        r = client.post('/stories', json={'content': 'Hei', 'type': 'text'})
        sid = r.get_json()['story']['id']
        client2 = _new_client()
        _register(client2, 'bob')
        client.post('/contacts', json={'username': 'bob'})
        r = client2.post(f'/stories/{sid}/view')
        assert r.status_code == 200


class TestSlowMode:
    def test_set_slowmode(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.post(f'/groups/{gid}/slowmode', json={'seconds': 30})
        assert r.status_code == 200

    def test_get_slowmode(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        client.post(f'/groups/{gid}/slowmode', json={'seconds': 30})
        r = client.get(f'/groups/{gid}/slowmode')
        assert r.status_code == 200
        assert r.get_json()['seconds'] == 30


class TestInviteLinks:
    def test_get_invite_link(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.get(f'/groups/{gid}/invite-link')
        assert r.status_code == 200
        assert 'link' in r.get_json()

    def test_resolve_invite(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.get(f'/groups/{gid}/invite-link')
        token = r.get_json()['link']
        r = client.get(f'/invite/{token}')
        assert r.status_code == 200
        assert r.get_json()['groupId'] == gid

    def test_join_via_invite(self, client):
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.get(f'/groups/{gid}/invite-link')
        token = r.get_json()['link']
        client2 = _new_client()
        _register(client2, 'bob')
        r = client2.post(f'/invite/{token}/join')
        assert r.status_code == 200
        assert r.get_json()['groupId'] == gid

    def test_invalid_invite(self, client):
        _register(client, 'alice')
        r = client.get('/invite/invalidtoken123')
        assert r.status_code == 404

    def test_expired_invite_rejected(self, client):
        import app as app_mod
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.get(f'/groups/{gid}/invite-link')
        token = r.get_json()['link']
        links = app_mod.load_json(app_mod.INVITE_LINKS_FILE, {})
        links[gid]['expires_at'] = '2000-01-01T00:00:00Z'
        app_mod.save_json(app_mod.INVITE_LINKS_FILE, links)
        r = client.get(f'/invite/{token}')
        assert r.status_code == 410

    def test_used_up_invite_rejected(self, client):
        import app as app_mod
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.get(f'/groups/{gid}/invite-link')
        token = r.get_json()['link']
        links = app_mod.load_json(app_mod.INVITE_LINKS_FILE, {})
        links[gid]['max_uses'] = 1
        links[gid]['uses'] = 1
        app_mod.save_json(app_mod.INVITE_LINKS_FILE, links)
        r = client.get(f'/invite/{token}')
        assert r.status_code == 410

    def test_join_increments_use(self, client):
        import app as app_mod
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': []})
        gid = r.get_json()['group']['id']
        r = client.get(f'/groups/{gid}/invite-link')
        token = r.get_json()['link']
        client2 = _new_client()
        _register(client2, 'bob')
        r = client2.post(f'/invite/{token}/join')
        assert r.status_code == 200
        links = app_mod.load_json(app_mod.INVITE_LINKS_FILE, {})
        assert links[gid]['uses'] == 1

    def test_security_headers(self, client):
        _register(client, 'alice')
        r = client.get('/health')
        assert r.headers.get('Strict-Transport-Security', '').startswith('max-age=31536000')
        assert r.headers.get('Cross-Origin-Opener-Policy') == 'same-origin'
        assert 'sandbox' in r.headers.get('Content-Security-Policy', '') or 'default-src' in r.headers.get('Content-Security-Policy', '')
        assert r.headers.get('X-Frame-Options') == 'DENY'


class TestMessageReporting:
    def test_report_message(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'bad', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        mid = msgs[0]['id']
        r = client.post('/report', json={'message_id': mid, 'reason': 'Spam', 'type': 'spam'})
        assert r.status_code == 200


class TestForwardMessage:
    def test_forward_message(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        _register(client, 'charlie')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'forward me', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        mid = msgs[0]['id']
        r = client.post(f'/messages/{mid}/forward', json={'target': 'charlie', 'target_type': 'user'})
        assert r.status_code == 200


class TestSavedMessages:
    def test_save_message(self, client):
        _register(client, 'alice')
        r = client.post('/saved', json={'ciphertext': 'bookmark this', 'type': 'text'})
        assert r.status_code == 200

    def test_get_saved(self, client):
        _register(client, 'alice')
        client.post('/saved', json={'ciphertext': 'bookmark', 'type': 'text'})
        r = client.get('/saved')
        assert r.status_code == 200
        assert len(r.get_json()['messages']) == 1


class TestPinnedChats:
    def test_toggle_pinned_chat(self, client):
        _register(client, 'alice')
        r = client.post('/pinned-chats', json={'chatId': 'bob', 'chatType': 'user'})
        assert r.status_code == 200

    def test_get_pinned_chats(self, client):
        _register(client, 'alice')
        client.post('/pinned-chats', json={'chatId': 'bob', 'chatType': 'user'})
        r = client.get('/pinned-chats')
        assert r.status_code == 200
        assert len(r.get_json()['pinned']) == 1


class TestMuteChat:
    def test_toggle_mute(self, client):
        _register(client, 'alice')
        r = client.post('/settings/mute', json={'chatId': 'bob', 'muted': True})
        assert r.status_code == 200

    def test_get_muted(self, client):
        _register(client, 'alice')
        client.post('/settings/mute', json={'chatId': 'bob', 'muted': True})
        r = client.get('/settings/mute')
        assert r.status_code == 200
        assert 'bob' in r.get_json()['muted']


class TestDrafts:
    def test_save_draft(self, client):
        _register(client, 'alice')
        r = client.post('/drafts', json={'target': 'bob', 'text': 'utkast'})
        assert r.status_code == 200

    def test_get_drafts(self, client):
        _register(client, 'alice')
        client.post('/drafts', json={'target': 'bob', 'text': 'utkast'})
        r = client.get('/drafts')
        assert r.status_code == 200
        assert 'bob' in r.get_json()['drafts']


class TestDeleteForMe:
    def test_delete_for_me(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'delete me', 'type': 'text'})
        msgs = client.get('/messages/bob').get_json()['messages']
        mid = msgs[0]['id']
        r = client.delete(f'/messages/{mid}/me')
        assert r.status_code == 200


class TestPasswordChange:
    def test_change_password(self, client):
        _register(client, 'alice')
        r = client.post('/auth/change-password', json={
            'old_password': 'Passw0rd!23',
            'new_password': 'N3wP@ssw0rd!',
        })
        assert r.status_code == 200
        r = client.post('/auth/login', json={'username': 'alice', 'password': 'N3wP@ssw0rd!'})
        assert r.status_code == 200

    def test_change_password_wrong_old(self, client):
        _register(client, 'alice')
        r = client.post('/auth/change-password', json={
            'old_password': 'wrong',
            'new_password': 'N3wP@ssw0rd!',
        })
        assert r.status_code == 401


class TestSearchV2:
    def test_search_v2_empty(self, client):
        _register(client, 'alice')
        r = client.get('/search/v2')
        assert r.status_code == 200
        assert r.get_json()['results'] == []

    def test_search_v2_with_query(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'findable', 'type': 'text'})
        r = client.get('/search/v2?q=findable')
        assert r.status_code == 200


class TestExportChat:
    def test_export_user_chat(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'export me', 'type': 'text'})
        r = client.get('/export/user/bob')
        assert r.status_code == 200
        assert b'export me' in r.data


class TestStickers:
    def test_list_packs(self, client):
        r = client.get('/stickers')
        assert r.status_code == 200
        assert len(r.get_json()['packs']) > 0

    def test_get_pack(self, client):
        r = client.get('/stickers/smileys')
        assert r.status_code == 200
        assert r.get_json()['pack']['name'] == 'Smileys'


class TestGroupAdminRoles:
    def _create_group(self, client, name='g', members=None):
        r = client.post('/groups', json={'name': name, 'members': members or []})
        return r.get_json()['group']['id']

    def test_set_admin(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        gid = self._create_group(client, 'g', ['alice', 'bob'])
        r = client.post(f'/groups/{gid}/admins', json={'username': 'bob', 'role': 'admin'})
        assert r.status_code == 200

    def test_remove_admin(self, client):
        _register(client, 'alice')
        _register(client, 'bob')
        gid = self._create_group(client, 'g', ['alice', 'bob'])
        client.post(f'/groups/{gid}/admins', json={'username': 'bob', 'role': 'admin'})
        r = client.delete(f'/groups/{gid}/admins/bob')
        assert r.status_code == 200


class TestKeyRotation:
    def test_rotate_key(self, client):
        _register(client, 'alice')
        r = client.post('/key/rotate')
        assert r.status_code == 200

    def test_key_rotation_status(self, client):
        _register(client, 'alice')
        r = client.get('/key/rotation-status')
        assert r.status_code == 200
        assert 'rotated_at' in r.get_json()


class TestMultiDevice:
    def test_sync_key(self, client):
        _register(client, 'alice')
        r = client.post('/sync/keys', json={'publicKey': 'pubkey123', 'deviceId': 'phone1'})
        assert r.status_code == 200

    def test_get_synced_keys(self, client):
        _register(client, 'alice')
        client.post('/sync/keys', json={'publicKey': 'pubkey123', 'deviceId': 'phone1'})
        r = client.get('/sync/keys')
        assert r.status_code == 200
        assert 'phone1' in r.get_json()['syncedKeys']

    def test_remove_synced_key(self, client):
        _register(client, 'alice')
        client.post('/sync/keys', json={'publicKey': 'pubkey123', 'deviceId': 'phone1'})
        r = client.delete('/sync/keys/phone1')
        assert r.status_code == 200


class TestSessionManagement:
    def test_list_sessions(self, client):
        _register(client, 'alice')
        r = client.get('/sessions')
        assert r.status_code == 200
        assert len(r.get_json()['sessions']) == 1

    def test_revoke_session_self(self, client):
        _register(client, 'alice')
        sessions = client.get('/sessions').get_json()['sessions']
        sid = sessions[0]['id']
        r = client.post(f'/sessions/{sid}/revoke')
        assert r.status_code == 400

    def test_sliding_session_stays_active(self, client):
        from db import load_json, save_json
        from config import SESSIONS_FILE
        from datetime import datetime, timedelta
        _register(client, 'alice')
        s = load_json(SESSIONS_FILE, {})
        sid = next(iter(s['alice']))
        s['alice'][sid]['created'] = (datetime.utcnow() - timedelta(minutes=40)).isoformat() + 'Z'
        s['alice'][sid]['last_active'] = datetime.utcnow().isoformat() + 'Z'
        save_json(SESSIONS_FILE, s)
        r = client.get('/admin/stats')
        assert r.status_code == 403

    def test_session_expires_after_inactivity(self, client):
        from db import load_json, save_json, invalidate_cache
        from config import SESSIONS_FILE
        from datetime import datetime, timedelta
        _register(client, 'alice')
        s = load_json(SESSIONS_FILE, {})
        sid = next(iter(s['alice']))
        s['alice'][sid]['created'] = (datetime.utcnow() - timedelta(minutes=40)).isoformat() + 'Z'
        s['alice'][sid]['last_active'] = (datetime.utcnow() - timedelta(minutes=40)).isoformat() + 'Z'
        save_json(SESSIONS_FILE, s)
        invalidate_cache()
        r = client.get('/admin/stats')
        assert r.status_code == 401


class TestAISummary:
    def test_ai_summary_no_unread(self, client):
        _register(client, 'alice')
        r = client.post('/ai/summary')
        assert r.status_code == 200
        assert 'Ingen uleste' in r.get_json()['summary']

    def test_ai_summary_with_unread(self, client):
        client2 = _setup_pair(client)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': 'Hei bob, mottes i morgen?', 'type': 'text'})
        r = client2.post('/ai/summary')
        assert r.status_code == 200
        data = r.get_json()
        assert data['success'] is True
        assert len(data['chats']) == 1
        assert data['chats'][0]['name'] == 'alice'
        assert data['chats'][0]['count'] == 1

    def test_ai_summary_requires_login(self, client):
        r = client.post('/ai/summary')
        assert r.status_code == 401


class TestUpload:
    def test_upload_without_login(self, client):
        r = client.post('/upload', data={'recipient': 'bob'})
        assert r.status_code in (401, 302)

    def test_upload_no_file(self, client):
        _register(client, 'alice')
        r = client.post('/upload', data={'recipient': 'bob'})
        assert r.status_code == 400

    def test_upload_user_returns_stored_name_and_serves_file(self, client):
        import io
        import app as app_mod
        _setup_pair(client)
        r = client.post('/upload', data={'recipient': 'bob', 'file': (io.BytesIO(b'hello file'), 'cat.jpg')}, content_type='multipart/form-data')
        assert r.status_code == 200
        stored = r.get_json()['filename']
        assert stored.endswith('_cat.jpg')
        messages = app_mod.load_json(app_mod.MESSAGES_FILE, [])
        file_msgs = [m for m in messages if m.get('type') == 'file']
        assert len(file_msgs) == 1
        assert file_msgs[0]['filename'] == stored
        d = client.get('/uploads/' + stored)
        assert d.status_code == 200
        assert d.data == b'hello file'

    def test_upload_group_stores_name_and_serves_file(self, client):
        import io
        import app as app_mod
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': ['alice']})
        gid = r.get_json()['group']['id']
        r = client.post('/upload', data={'groupId': gid, 'file': (io.BytesIO(b'group file'), 'doc.pdf')}, content_type='multipart/form-data')
        assert r.status_code == 200
        stored = r.get_json()['filename']
        assert stored.endswith('_doc.pdf')
        messages = app_mod.load_json(app_mod.MESSAGES_FILE, [])
        file_msgs = [m for m in messages if m.get('type') == 'file']
        assert len(file_msgs) == 1
        assert file_msgs[0]['filename'] == stored
        d = client.get('/uploads/' + stored)
        assert d.status_code == 200
        assert d.data == b'group file'

    def test_upload_group_denies_non_member(self, client):
        import io
        _register(client, 'alice')
        r = client.post('/groups', json={'name': 'g', 'members': ['alice']})
        gid = r.get_json()['group']['id']
        client2 = _new_client()
        _register(client2, 'eve')
        r = client2.post('/upload', data={'groupId': gid, 'file': (io.BytesIO(b'x'), 'a.txt')}, content_type='multipart/form-data')
        assert r.status_code == 403


class TestAdminRoutes:
    def test_admin_stats_requires_admin(self, client):
        _register(client, 'alice')
        r = client.get('/admin/stats')
        assert r.status_code == 403

    def test_admin_pages_requires_admin(self, client):
        _register(client, 'alice')
        r = client.get('/admin/pages')
        assert r.status_code == 403

    def test_admin_rotate_secret_requires_admin(self, client):
        _register(client, 'alice')
        r = client.post('/admin/rotate-secret')
        assert r.status_code == 403


class TestAIChat:
    def test_ai_chat_requires_login(self, client):
        r = client.post('/ai/chat', json={'prompt': 'hei'})
        assert r.status_code in (401, 302)

    def test_ai_chat_no_prompt(self, client):
        _register(client, 'alice')
        r = client.post('/ai/chat', json={'prompt': ''})
        assert r.status_code == 400

    def test_ai_chat_returns_501_when_disabled(self, client):
        _register(client, 'alice')
        r = client.post('/ai/chat', json={'prompt': 'hva er 2+2?'})
        assert r.status_code in (501, 502)


class TestAIReplies:
    def test_ai_replies_requires_login(self, client):
        r = client.post('/ai/replies', json={'text': 'hei'})
        assert r.status_code in (401, 302)

    def test_ai_replies_no_text(self, client):
        _register(client, 'alice')
        r = client.post('/ai/replies', json={'text': ''})
        assert r.status_code == 400

    def test_ai_replies_local_fallback(self, client):
        _register(client, 'alice')
        r = client.post('/ai/replies', json={'text': 'Vil du møtes i morgen?'})
        assert r.status_code == 200
        assert len(r.get_json()['replies']) >= 3


class TestReminders:
    def test_reminder_requires_login(self, client):
        r = client.post('/reminders', json={'text': 'test', 'minutes': '5'})
        assert r.status_code in (401, 302)

    def test_reminder_create_and_list(self, client):
        _register(client, 'alice')
        r = client.post('/reminders', json={'text': 'Kjøp melk', 'minutes': '60'})
        assert r.status_code == 200
        data = r.get_json()
        assert data['success'] is True
        rid = data['reminder']['id']
        r2 = client.get('/reminders')
        assert r2.status_code == 200
        ids = [x['id'] for x in r2.get_json()['reminders']]
        assert rid in ids

    def test_reminder_requires_future(self, client):
        _register(client, 'alice')
        r = client.post('/reminders', json={'text': 'fortid', 'minutes': '0'})
        assert r.status_code == 400

    def test_reminder_cancel(self, client):
        _register(client, 'alice')
        r = client.post('/reminders', json={'text': 'Slett meg', 'minutes': '30'})
        rid = r.get_json()['reminder']['id']
        r2 = client.delete('/reminders/' + rid)
        assert r2.status_code == 200
        r3 = client.get('/reminders')
        assert r3.get_json()['reminders'] == []

    def test_reminder_delivery_creates_notification(self, client):
        _register(client, 'alice')
        r = client.post('/reminders', json={'text': 'Påminnelse', 'minutes': '1'})
        rid = r.get_json()['reminder']['id']
        import app as app_mod
        reminders = app_mod.load_json(app_mod.REMINDERS_FILE, [])
        for item in reminders:
            if item['id'] == rid:
                item['remind_at'] = (datetime.utcnow() - timedelta(seconds=5)).isoformat()
        app_mod.save_json(app_mod.REMINDERS_FILE, reminders)
        app_mod.deliver_reminders()
        notif = app_mod.load_json(app_mod.NOTIFICATIONS_FILE, {})
        types = [n.get('type') for n in notif.get('alice', [])]
        assert 'reminder' in types


class TestQuietHours:
    def test_quiet_hours_set_and_get(self, client):
        _register(client, 'alice')
        r = client.post('/settings/quiet', json={'enabled': True, 'start': '22:00', 'end': '07:00'})
        assert r.status_code == 200
        assert r.get_json()['quiet']['enabled'] is True
        r2 = client.get('/settings/quiet')
        assert r2.get_json()['quiet']['enabled'] is True

    def test_quiet_hours_invalid_time(self, client):
        _register(client, 'alice')
        r = client.post('/settings/quiet', json={'enabled': True, 'start': 'sju', 'end': '07:00'})
        assert r.status_code == 400

    def test_quiet_hours_disable(self, client):
        _register(client, 'alice')
        client.post('/settings/quiet', json={'enabled': True, 'start': '22:00', 'end': '07:00'})
        r = client.post('/settings/quiet', json={'enabled': False})
        assert r.status_code == 200
        r2 = client.get('/settings/quiet')
        assert r2.get_json()['quiet']['enabled'] is False

    def test_is_quiet_hours_helper(self, client):
        import app as app_mod
        assert app_mod.is_quiet_hours('no_such_user') is False


class TestBackup:
    def test_backup_requires_login(self, client):
        r = client.get('/backup')
        assert r.status_code in (401, 302)

    def test_backup_contains_messages(self, client):
        import app as app_mod
        _setup_pair(client)
        key = app_mod.get_or_create_pair_key('alice', 'bob')
        ciphertext = app_mod.encrypt_symmetric('backup meg', key)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': ciphertext, 'type': 'text'})
        r = client.get('/backup')
        assert r.status_code == 200
        data = json.loads(r.data)
        assert 'u:bob' in data['chats']
        texts = [m['text'] for m in data['chats']['u:bob']['messages']]
        assert any('backup meg' in t for t in texts)

    def test_export_pdf_user(self, client):
        import app as app_mod
        _setup_pair(client)
        key = app_mod.get_or_create_pair_key('alice', 'bob')
        ciphertext = app_mod.encrypt_symmetric('pdf meg', key)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': ciphertext, 'type': 'text'})
        r = client.get('/export/user/bob/pdf')
        assert r.status_code == 200
        assert 'text/html' in r.content_type
        assert b'pdf meg' in r.data
        assert b'onclick' not in r.data


class TestAdminStatsExtended:
    def test_admin_stats_has_chat_insights(self, client):
        import app as app_mod
        _setup_pair(client)
        key = app_mod.get_or_create_pair_key('alice', 'bob')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': app_mod.encrypt_symmetric('hei', key), 'type': 'text'})
        users = app_mod.load_json(app_mod.USERS_FILE, {})
        users['alice']['is_admin'] = True
        app_mod.save_json(app_mod.USERS_FILE, users)
        r = client.get('/admin/stats')
        assert r.status_code == 200
        s = r.get_json()['stats']
        assert 'top_senders' in s
        assert 'messages_per_hour' in s
        assert 'messages_per_day' in s
        assert s['total_messages'] >= 1


class TestDigestSettings:
    def test_digest_requires_login(self, client):
        r = client.get('/settings/digest')
        assert r.status_code in (401, 302)

    def test_digest_set_and_get(self, client):
        _register(client, 'alice')
        r = client.post('/settings/digest', json={'enabled': True, 'time': '08:30'})
        assert r.status_code == 200
        assert r.get_json()['enabled'] is True
        r2 = client.get('/settings/digest')
        assert r2.get_json()['enabled'] is True
        assert r2.get_json()['time'] == '08:30'

    def test_digest_invalid_time(self, client):
        _register(client, 'alice')
        r = client.post('/settings/digest', json={'enabled': True, 'time': 'sju'})
        assert r.status_code == 400

    def test_digest_delivery_creates_notification(self, client):
        import app as app_mod
        client2 = _setup_pair(client)
        key = app_mod.get_or_create_pair_key('alice', 'bob')
        client2.post('/send', json={'recipient': 'alice', 'ciphertext': app_mod.encrypt_symmetric('hei dag', key), 'type': 'text'})
        now = datetime.utcnow()
        time_str = now.strftime('%H:%M')
        r = client.post('/settings/digest', json={'enabled': True, 'time': time_str})
        assert r.status_code == 200
        app_mod.deliver_digests()
        notif = app_mod.load_json(app_mod.NOTIFICATIONS_FILE, {})
        types = [n.get('type') for n in notif.get('alice', [])]
        assert 'digest' in types


class TestAIThreadSummary:
    def test_thread_summary_requires_login(self, client):
        r = client.post('/ai/chat/summary', json={'chat_type': 'user', 'chat_id': 'bob'})
        assert r.status_code in (401, 302)

    def test_thread_summary_missing_chat(self, client):
        _register(client, 'alice')
        r = client.post('/ai/chat/summary', json={})
        assert r.status_code == 400

    def test_thread_summary_user_local_fallback(self, client):
        import app as app_mod
        _setup_pair(client)
        key = app_mod.get_or_create_pair_key('alice', 'bob')
        client.post('/send', json={'recipient': 'bob', 'ciphertext': app_mod.encrypt_symmetric('Hva skal vi gjøre i helgen?', key), 'type': 'text'})
        r = client.post('/ai/chat/summary', json={'chat_type': 'user', 'chat_id': 'bob'})
        assert r.status_code == 200
        data = r.get_json()
        assert data['success'] is True
        assert data['summary']

    def test_thread_summary_group_denied(self, client):
        _setup_pair(client)
        r = client.post('/ai/chat/summary', json={'chat_type': 'group', 'chat_id': 'nope'})
        assert r.status_code == 403


class TestAITheme:
    def test_theme_requires_login(self, client):
        r = client.post('/ai/theme', json={'description': 'skog'})
        assert r.status_code in (401, 302)

    def test_theme_no_description(self, client):
        _register(client, 'alice')
        r = client.post('/ai/theme', json={'description': ''})
        assert r.status_code == 400

    def test_theme_disabled_ai(self, client):
        _register(client, 'alice')
        r = client.post('/ai/theme', json={'description': 'skog'})
        assert r.status_code == 501


class TestAIFolderSuggest:
    def test_folder_suggest_requires_login(self, client):
        r = client.post('/ai/folder-suggest', json={'chat_name': 'bob'})
        assert r.status_code in (401, 302)

    def test_folder_suggest_no_chat_name(self, client):
        _register(client, 'alice')
        r = client.post('/ai/folder-suggest', json={'chat_name': ''})
        assert r.status_code == 400

    def test_folder_suggest_disabled_ai_returns_name(self, client):
        _register(client, 'alice')
        r = client.post('/ai/folder-suggest', json={'chat_name': 'Kari'})
        assert r.status_code == 200
        assert r.get_json()['suggestion'] == 'Kari'


class TestHTMLExport:
    def test_export_html_user(self, client):
        import app as app_mod
        _setup_pair(client)
        key = app_mod.get_or_create_pair_key('alice', 'bob')
        ciphertext = app_mod.encrypt_symmetric('html meg', key)
        client.post('/send', json={'recipient': 'bob', 'ciphertext': ciphertext, 'type': 'text'})
        r = client.get('/export/user/bob/html')
        assert r.status_code == 200
        assert 'text/html' in r.content_type
        assert b'html meg' in r.data
        assert b'onclick' not in r.data
        assert 'attachment' in r.headers.get('Content-Disposition', '')


class TestAdminBroadcast:
    def test_broadcast_requires_admin(self, client):
        _register(client, 'alice')
        r = client.post('/admin/broadcast', json={'text': 'hei alle'})
        assert r.status_code == 403

    def test_broadcast_no_text(self, client):
        import app as app_mod
        _setup_pair(client)
        users = app_mod.load_json(app_mod.USERS_FILE, {})
        users['alice']['is_admin'] = True
        app_mod.save_json(app_mod.USERS_FILE, users)
        r = client.post('/admin/broadcast', json={'text': ''})
        assert r.status_code == 400

    def test_broadcast_sends_to_others(self, client):
        import app as app_mod
        client2 = _setup_pair(client)
        users = app_mod.load_json(app_mod.USERS_FILE, {})
        users['alice']['is_admin'] = True
        app_mod.save_json(app_mod.USERS_FILE, users)
        r = client.post('/admin/broadcast', json={'text': 'Viktig kunngjøring'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True
        notif = app_mod.load_json(app_mod.NOTIFICATIONS_FILE, {})
        types = [n.get('type') for n in notif.get('bob', [])]
        assert 'broadcast' in types


class TestDigestE2eePlaceholder:
    def test_plain_text_passthrough(self):
        import app as app_mod
        assert app_mod._digest_text({'type': 'text', 'ciphertext': 'Hei, hvordan går det?'}) == 'Hei, hvordan går det?'

    def test_e2ee_ciphertext_masked(self):
        import app as app_mod
        fake_ct = 'V1Fy7kHAwAG/0RLQ.8biTeS7pqKuixbMoMCGywomwVixgtWU7byep2ok2UA=='
        assert app_mod._digest_text({'type': 'text', 'ciphertext': fake_ct}) == '[kryptert melding]'

    def test_file_uses_filename(self):
        import app as app_mod
        assert app_mod._digest_text({'type': 'file', 'filename': 'rapport.pdf'}) == '📎 rapport.pdf'


class TestPushSubscribe:
    def test_vapid_key_endpoint(self, client):
        import app as app_mod
        r = client.get('/push/vapid-key')
        assert r.status_code == 200
        assert r.get_json()['key'] == app_mod.VAPID_PUBLIC_KEY

    def test_subscribe_and_unsubscribe(self, client):
        import app as app_mod
        _register(client, 'alice')
        sub = {'endpoint': 'https://fcm.googleapis.com/fcm/send/abc123', 'keys': {'p256dh': 'A' * 43, 'auth': 'B' * 22}, 'expirationTime': None}
        r = client.post('/push/subscribe', json={'subscription': sub})
        assert r.status_code == 200
        subs = app_mod.load_json(app_mod.PUSH_SUBSCRIPTIONS_FILE, {})
        assert subs['alice'][0]['endpoint'] == sub['endpoint']
        r = client.post('/push/unsubscribe', json={'endpoint': sub['endpoint']})
        assert r.status_code == 200
        subs = app_mod.load_json(app_mod.PUSH_SUBSCRIPTIONS_FILE, {})
        assert subs['alice'] == []

    def test_subscribe_rejects_invalid_endpoint(self, client):
        import app as app_mod
        _register(client, 'alice')
        for endpoint in ('http://127.0.0.1:5000/admin', 'https://169.254.169.254/latest/meta-data/', 'https://localhost/admin', 'http://push.example.test/x'):
            sub = {'endpoint': endpoint, 'keys': {'p256dh': 'A' * 43, 'auth': 'B' * 22}}
            r = client.post('/push/subscribe', json={'subscription': sub})
            assert r.status_code == 400, endpoint
        subs = app_mod.load_json(app_mod.PUSH_SUBSCRIPTIONS_FILE, {})
        assert subs.get('alice') in (None, [])


class TestWebPushSend:
    def _stub_server(self, status_code):
        import http.server
        import threading
        import base64

        captured = {}
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                length = int(self.headers.get('Content-Length', 0))
                captured['body'] = self.rfile.read(length)
                captured['headers'] = dict(self.headers)
                self.send_response(status_code)
                self.end_headers()
            def log_message(self, *args):
                pass

        server = http.server.HTTPServer(('127.0.0.1', 0), Handler)
        t = threading.Thread(target=server.serve_forever, daemon=True)
        t.start()
        return server, captured

    def _subscription(self, endpoint):
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization
        import base64
        kp = ec.generate_private_key(ec.SECP256R1())
        p256dh = base64.urlsafe_b64encode(kp.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)).decode().rstrip('=')
        auth = base64.urlsafe_b64encode(os.urandom(16)).decode().rstrip('=')
        return {'endpoint': endpoint, 'keys': {'p256dh': p256dh, 'auth': auth}}

    def test_send_delivers_encrypted_payload(self, client):
        import app as app_mod
        if not app_mod.VAPID_PUBLIC_KEY or not app_mod.VAPID_PRIVATE_KEY:
            import pytest as _pt
            _pt.skip('VAPID-nøkler mangler')
        server, captured = self._stub_server(201)
        endpoint = f'http://127.0.0.1:{server.server_address[1]}/push'
        ok = app_mod._send_web_push(self._subscription(endpoint), 'Tittel', 'Melding', '/chat')
        server.server_close()
        assert ok is True
        assert captured['body']
        headers = {k.lower(): v for k, v in captured['headers'].items()}
        assert headers.get('content-encoding') == 'aes128gcm'
        assert headers.get('authorization', '').startswith('vapid')

    def test_expired_subscription_removed(self, client):
        import app as app_mod
        server, captured = self._stub_server(410)
        endpoint = f'http://127.0.0.1:{server.server_address[1]}/push'
        sub = self._subscription(endpoint)
        app_mod.load_json(app_mod.PUSH_SUBSCRIPTIONS_FILE, {})
        subs = {'alice': [sub]}
        app_mod.save_json(app_mod.PUSH_SUBSCRIPTIONS_FILE, subs)
        app_mod._notify_push('alice', 'T', 'B', '/chat')
        server.server_close()
        subs = app_mod.load_json(app_mod.PUSH_SUBSCRIPTIONS_FILE, {})
        assert subs.get('alice') == []


class TestJsonlMigration:
    def test_migrate_parses_json_lines(self):
        from db import DATA_DIR, migrate_json_files, _read_from_sqlite, _write_to_sqlite
        path = DATA_DIR / 'audit_test.jsonl'
        path.write_text('{"event": "a", "actor": "x"}\n{"event": "b", "actor": "y"}\n', encoding='utf-8')
        _write_to_sqlite(str(path), None)
        migrate_json_files()
        data = _read_from_sqlite(str(path))
        assert data == [{'event': 'a', 'actor': 'x'}, {'event': 'b', 'actor': 'y'}]
        path.unlink(missing_ok=True)


class TestForwardSecrecy:
    def _create_group(self, client, name='g', members=None):
        r = client.post('/groups', json={'name': name, 'members': members or []})
        return r.get_json()['group']['id']

    def _upload_group_keys(self, client, gid):
        r = client.post(f'/groups/{gid}/keys', json={'keys': {'alice': 'wrapped-key-a', 'bob': 'wrapped-key-b'}})
        assert r.status_code == 200
        import app as app_mod
        keys_data = app_mod.load_json(app_mod.KEYS_FILE, {})
        assert keys_data.get(f'e2ee::{gid}', {}).get('encrypted_keys')

    def test_remove_member_rekeys_group(self, client):
        import app as app_mod
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        gid = self._create_group(client, 'g', ['alice', 'bob'])
        client.post(f'/groups/{gid}/members', json={'username': 'bob'})
        self._upload_group_keys(client, gid)
        r = client.delete(f'/groups/{gid}/members/bob')
        assert r.status_code == 200
        assert r.get_json()['rekey'] is True
        keys_data = app_mod.load_json(app_mod.KEYS_FILE, {})
        assert keys_data.get(f'e2ee::{gid}', {}).get('encrypted_keys') == {}
        assert keys_data.get(f'e2ee::{gid}', {}).get('rotation_id')

    def test_leave_group_rekeys_group(self, client):
        import app as app_mod
        _register(client, 'alice')
        client2 = _new_client()
        _register(client2, 'bob')
        gid = self._create_group(client, 'g', ['alice', 'bob'])
        self._upload_group_keys(client, gid)
        r = client2.post(f'/groups/{gid}/leave')
        assert r.status_code == 200
        assert r.get_json()['rekey'] is True
        keys_data = app_mod.load_json(app_mod.KEYS_FILE, {})
        assert keys_data.get(f'e2ee::{gid}', {}).get('encrypted_keys') == {}

    def test_rotate_pair_key_removes_server_key(self, client):
        import app as app_mod
        _setup_pair(client)
        key_before = app_mod.get_or_create_pair_key('alice', 'bob')
        assert key_before
        r = client.post('/key/rotate-pair', json={'partner': 'bob'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True
        keys_data = app_mod.load_json(app_mod.KEYS_FILE, {})
        pk = app_mod.pair_key('alice', 'bob')
        assert pk not in keys_data
        key_after = app_mod.get_or_create_pair_key('alice', 'bob')
        assert key_after != key_before


class TestKeyBackup:
    def test_save_get_delete_backup(self, client):
        import app as app_mod
        _register(client, 'alice')
        r = client.post('/account/backup', json={'blob': '{"version":1,"kdf":"PBKDF2"}'})
        assert r.status_code == 200
        assert r.get_json()['success'] is True
        r = client.get('/account/backup')
        assert r.status_code == 200
        assert r.get_json()['blob'] == '{"version":1,"kdf":"PBKDF2"}'
        r = client.delete('/account/backup')
        assert r.status_code == 200
        r = client.get('/account/backup')
        assert r.status_code == 404

    def test_backup_requires_login(self, client):
        r = client.get('/account/backup')
        assert r.status_code == 401

    def test_oversized_blob_rejected(self, client):
        _register(client, 'alice')
        r = client.post('/account/backup', json={'blob': 'x' * 200001})
        assert r.status_code == 400
