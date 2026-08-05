#!/usr/bin/env python3
"""Rotér VAPID-nøklene for push. Gamle nøkler ligger i secrets/*.old (og i backup)."""
from pathlib import Path
import os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

SECRETS = Path(__file__).resolve().parents[1] / 'secrets'
PUB = SECRETS / 'vapid_public.key'
PRIV = SECRETS / 'vapid_private.key'

if not PUB.exists() or not PRIV.exists():
    sys.exit('Mangler eksisterende VAPID-nøkler i secrets/.')

def to_urlsafe(pem_bytes: bytes) -> str:
    return base64.urlsafe_b64encode(pem_bytes).rstrip(b'=').decode()

priv = ec.generate_private_key(ec.SECP256R1())
pub = priv.public_key()
pub_pem = pub.public_bytes(
    serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
priv_pem = priv.private_bytes(
    serialization.Encoding.DER, serialization.PrivateFormat.TraditionalOpenSSL,
    serialization.NoEncryption())

if not PUB.read_text().strip():
    sys.exit('Tom offentlig nøkkel — stopp.')

PUB.rename(SECRETS / 'vapid_public.key.old')
PRIV.rename(SECRETS / 'vapid_private.key.old')
PUB.write_text(to_urlsafe(pub_pem))
PRIV.write_text(to_urlsafe(priv_pem))
PUB.chmod(0o644); PRIV.chmod(0o600)

print('Nye VAPID-nøkler skrevet. Gamle ligger i secrets/*.old')
print('Public:', to_urlsafe(pub_pem))
print('Restart tjenesten: sudo systemctl restart cryptochat')
print('Klienter re-subscriber automatisk ved neste besøk (bootstrap.js)')
