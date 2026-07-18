window.__CRYPTO__ = (() => {
  'use strict';
  const PEM_HEADER = '-----BEGIN PRIVATE KEY-----';
  const PEM_FOOTER = '-----END PRIVATE KEY-----';
  const PUBLIC_HEADER = '-----BEGIN PUBLIC KEY-----';
  const PUBLIC_FOOTER = '-----END PUBLIC KEY-----';

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function encodePem(buffer, type = 'PRIVATE') {
    const b64 = arrayBufferToBase64(buffer);
    const lines = b64.match(/.{1,64}/g) || [];
    const header = type === 'PUBLIC' ? PUBLIC_HEADER : PEM_HEADER;
    const footer = type === 'PUBLIC' ? PUBLIC_FOOTER : PEM_FOOTER;
    return header + '\n' + lines.join('\n') + '\n' + footer;
  }

  function decodePem(pem) {
    const b64 = pem.replace(PEM_HEADER, '').replace(PEM_FOOTER, '').replace(/\s/g, '');
    return base64ToArrayBuffer(b64);
  }

  async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    return {
      publicKeyPem: encodePem(publicKeyBuffer, 'PUBLIC'),
      privateKeyPem: encodePem(privateKeyBuffer, 'PRIVATE')
    };
  }

  async function importPublicKey(pem) {
    const binary = decodePem(pem.replace(PEM_HEADER, PUBLIC_HEADER).replace(PEM_FOOTER, PUBLIC_FOOTER));
    return window.crypto.subtle.importKey('spki', binary, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  }

  async function importPrivateKey(pem) {
    const binary = decodePem(pem);
    return window.crypto.subtle.importKey('pkcs8', binary, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
  }

  async function deriveSharedSecret(privateKey, publicKey) {
    return window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: publicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptMessage(message, key) {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(message)
    );
    return {
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertext)
    };
  }

  async function decryptMessage(encrypted, key) {
    const decoder = new TextDecoder();
    const iv = base64ToArrayBuffer(encrypted.iv);
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return decoder.decode(decrypted);
  }

  function getMyKeyPair() {
    const stored = localStorage.getItem('identityKeyPair');
    if (stored) return JSON.parse(stored);
    return null;
  }

  function saveMyKeyPair(keyPair) {
    localStorage.setItem('identityKeyPair', JSON.stringify(keyPair));
  }

  async function getOrCreateIdentity() {
    let existing = getMyKeyPair();
    if (existing) return existing;
    const generated = await generateKeyPair();
    saveMyKeyPair(generated);
    return generated;
  }

  async function getSharedKey(theirPublicKeyPem) {
    const myKeyPair = await getOrCreateIdentity();
    const myKey = await importPrivateKey(myKeyPair.privateKeyPem);
    const theirKey = await importPublicKey(theirPublicKeyPem);
    const sharedKey = await deriveSharedSecret(myKey, theirKey);
    return sharedKey;
  }

  const crypto = {
    PEM_HEADER,
    PEM_FOOTER,
    PUBLIC_HEADER,
    PUBLIC_FOOTER,
    generateKeyPair,
    importPublicKey,
    importPrivateKey,
    deriveSharedSecret,
    encryptMessage,
    decryptMessage,
    getMyKeyPair,
    saveMyKeyPair,
    getOrCreateIdentity,
    getSharedKey
  };

  return crypto;
})();
