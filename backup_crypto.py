#!/usr/bin/env python3
from pathlib import Path
import os, sys, base64
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _load_key(path: Path) -> bytes:
    data = path.read_bytes()
    if len(data) < 32:
        raise RuntimeError('backup key too short')
    # Use first 32 bytes as key material; derive a fixed AES-256 key
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'cryptochat-backup').derive(data[:32])


def encrypt_file(src: Path, dst: Path, key_path: Path) -> None:
    key = _load_key(key_path)
    aes = AESGCM(key)
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, src.read_bytes(), None)
    dst.write_bytes(nonce + ct)


def decrypt_file(src: Path, dst: Path, key_path: Path) -> None:
    key = _load_key(key_path)
    aes = AESGCM(key)
    data = src.read_bytes()
    nonce, ct = data[:12], data[12:]
    dst.write_bytes(aes.decrypt(nonce, ct, None))


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('mode', choices=('enc','dec'))
    p.add_argument('src')
    p.add_argument('dst')
    p.add_argument('--key', default=str(Path('secrets/backup_key')))
    args = p.parse_args()
    if args.mode == 'enc':
        encrypt_file(Path(args.src), Path(args.dst), Path(args.key))
    else:
        decrypt_file(Path(args.src), Path(args.dst), Path(args.key))
