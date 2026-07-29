#!/usr/bin/env python3
"""CryptoChat auth flow verification script.
Verifies:
 - /health public endpoint
 - login page presence + CSRF token in meta/forms
 - /auth/login rejects invalid credentials with 401
 - protected endpoints require auth (401)
"""

import json
import re
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from html.parser import HTMLParser

BASE = 'https://raspberrypi5.tail686286.ts.net'
CHECKS = []


def ok(cond, label):
    CHECKS.append((bool(cond), label))
    print(f"{'OK' if cond else 'FAIL'} {label}")


def get(path):
    return urlopen(Request(BASE + path), timeout=15)


def post_json(path, data):
    body = json.dumps(data).encode('utf-8')
    req = Request(BASE + path, data=body, headers={'Content-Type': 'application/json'})
    return urlopen(req, timeout=15)


class CsrfHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.csrf = None
        self.form_action = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name') == 'csrf-token':
            self.csrf = attrs.get('content')
        if tag == 'form' and attrs.get('action'):
            self.form_action = attrs.get('action')
        if tag == 'input' and attrs.get('name') == 'csrf_token':
            if not self.csrf:
                self.csrf = attrs.get('value')


# 1) Health
try:
    with get('/health') as r:
        body = r.read().decode('utf-8')
        ok(r.status == 200 and 'healthy' in body, f'health status={r.status}')
except Exception as e:
    ok(False, f'health failed: {e}')

# 2) Login page + CSRF
try:
    with get('/login') as r:
        html = r.read().decode('utf-8', errors='ignore')
        ok(r.status == 200, f'login page status={r.status}')
        p = CsrfHTMLParser()
        p.feed(html)
        ok(p.csrf is not None and len(p.csrf) > 0, f'csrf_token found={p.csrf is not None}')
        if p.csrf:
            CHECKS[-1] = (CHECKS[-1][0], f'csrf_token found len={len(p.csrf)}')
except Exception as e:
    ok(False, f'login page failed: {e}')

# 3) Invalid login should return 401 JSON
try:
    body = json.dumps({'username': 'invalid', 'password': 'invalid', 'csrf_token': ''}).encode('utf-8')
    req = Request(BASE + '/auth/login', data=body, headers={'Content-Type': 'application/json'})
    try:
        with urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode('utf-8'))
            ok(False, f'/auth/login unexpected 200: {data}')
    except HTTPError as e:
        ok(e.code in (400, 401, 403), f'/auth/login invalid status={e.code}')
except Exception as e:
    ok(False, f'/auth/login error: {e}')

# 4) Protected endpoints require auth
endpoints = [
    '/users/all',
    '/groups',
    '/last-messages',
    '/unread',
    '/presence/batch',
    '/verify/batch',
    '/calls/incoming',
    '/admin/stats',
]
for ep in endpoints:
    method = 'POST' if ep in ('/presence/batch', '/verify/batch') else 'GET'
    try:
        if method == 'POST':
            req = Request(BASE + ep, data=b'{}', headers={'Content-Type': 'application/json'})
        else:
            req = Request(BASE + ep)
        try:
            with urlopen(req, timeout=15) as r:
                ok(False, f'{ep} unexpected 200')
        except HTTPError as e:
            ok(e.code in (401, 403), f'{ep} auth required status={e.code}')
    except Exception as e:
        ok(False, f'{ep} error: {e}')

passed = sum(1 for c in CHECKS if c[0])
failed = sum(1 for c in CHECKS if not c[0])
print(f'\nRESULT {passed}/{passed+failed} checks passed')
sys.exit(1 if failed else 0)
