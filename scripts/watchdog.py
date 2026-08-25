#!/usr/bin/env python3
"""Vaktmester: sjekker om cryptochat-serveren kjører, sender FCM-push ved feil."""
import json, os, sys, time, urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
HEALTH_URL = os.environ.get('WATCHDOG_URL', 'http://127.0.0.1:5000/health')
STATE_FILE = Path(os.environ.get('WATCHDOG_STATE', '/tmp/cryptochat-watchdog-state'))
REPEAT_MINUTES = int(os.environ.get('WATCHDOG_REPEAT', '30'))
DOWN_SECONDS = 60

def _load_firebase_service_account():
    sa_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '') or str(BASE_DIR / 'secrets/firebase-service-account.json')
    p = Path(sa_path)
    if not p.exists():
        return None
    try:
        sa = json.loads(p.read_text(encoding='utf-8'))
        if sa.get('client_email') and sa.get('private_key'):
            return sa
    except Exception:
        pass
    return None

def _get_access_token(sa):
    import base64
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding as asym_padding

    now = int(time.time())
    def _b64(data):
        return base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip('=')

    claims = _b64({'alg': 'RS256', 'typ': 'JWT'})
    payload = _b64({
        'iss': sa['client_email'],
        'scope': 'https://www.googleapis.com/auth/firebase.messaging',
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now, 'exp': now + 3600,
    })
    header_claims = claims + '.' + payload
    key = serialization.load_pem_private_key(sa['private_key'].encode(), password=None)
    sig = key.sign(header_claims.encode(), asym_padding.PKCS1v15(), hashes.SHA256())
    assertion = header_claims + '.' + base64.urlsafe_b64encode(sig).decode().rstrip('=')

    data = f'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion={assertion}'.encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read()).get('access_token', '')

def _send_fcm_broadcast(title, body):
    sa = _load_firebase_service_account()
    if not sa:
        print('SKIP: ingen firebase service account')
        return
    subs_path = BASE_DIR / 'data/push_subscriptions.json'
    if not subs_path.exists():
        return
    subs = json.loads(subs_path.read_text())
    access = _get_access_token(sa)
    url = f'https://fcm.googleapis.com/v1/projects/{sa["project_id"]}/messages:send'
    sent = 0
    for user, entries in subs.items():
        for entry in entries:
            token = entry.get('fcm_token')
            if not token:
                continue
            payload = json.dumps({
                'message': {
                    'token': token,
                    'notification': {'title': title, 'body': body},
                    'data': {'url': '/chat'},
                    'android': {'priority': 'HIGH'},
                }
            }).encode()
            req = urllib.request.Request(url, data=payload,
                headers={'Authorization': 'Bearer ' + access, 'Content-Type': 'application/json; UTF-8'})
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    sent += 1
            except Exception:
                pass
    print(f'Sendt {sent} push-varsler')

def check():
    try:
        req = urllib.request.Request(HEALTH_URL, headers={'User-Agent': 'cryptochat-watchdog'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                return True
    except Exception:
        pass
    return False

def run():
    state = {}
    if STATE_FILE.exists():
        try:
            state = json.loads(STATE_FILE.read_text())
        except Exception:
            state = {}

    was_up = state.get('up', True)
    last_alert = state.get('last_alert', 0)
    now = time.time()

    up = check()

    if up and not was_up:
        _send_fcm_broadcast('CryptoChat', 'Serveren er oppe igjen ✓')
        state = {'up': True, 'last_alert': 0}
        STATE_FILE.write_text(json.dumps(state))
        print('STATUS: oppe igjen (varslet)')
        return

    if not up and was_up:
        _send_fcm_broadcast('CryptoChat', 'Serveren er nede ⚠️')
        state = {'up': False, 'last_alert': now}
        STATE_FILE.write_text(json.dumps(state))
        print('STATUS: nede (varslet)')
        return

    if not up and not was_up and (now - last_alert) > REPEAT_MINUTES * 60:
        _send_fcm_broadcast('CryptoChat', f'Serveren er fortsatt nede (sjekket for {REPEAT_MINUTES} min siden)')
        state['last_alert'] = now
        STATE_FILE.write_text(json.dumps(state))
        print(f'STATUS: fortsatt nede (repeterte varsel etter {REPEAT_MINUTES} min)')
        return

    STATE_FILE.write_text(json.dumps(state))
    print('STATUS: OK')

if __name__ == '__main__':
    run()
