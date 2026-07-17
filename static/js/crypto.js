const SimpleCrypto = (() => {
  function toUint8Array(str) { return new TextEncoder().encode(str); }
  function fromUint8Array(buf) { return new TextDecoder().decode(buf); }

  async function generateKey() {
    const key = await crypto.subtle.generateKey({ name:'AES-GCM', length:256 }, true, ['encrypt','decrypt']);
    const raw = await crypto.subtle.exportKey('raw', key);
    return Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function packEncrypt(plaintext, keyHex) {
    if (!keyHex) throw new Error('Manglende nøkkel');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyBytes = new Uint8Array(keyHex.match(/.{2}/g).map(h => parseInt(h, 16)));
    const aes = new AESGCM(keyBytes);
    const ct = aes.encrypt(iv, toUint8Array(plaintext));
    const data = { n: Array.from(iv).map(b => String.fromCharCode(b)), c: Array.from(new Uint8Array(ct)).map(b => String.fromCharCode(b)), v: 1 };
    return btoa(data.n + '::' + data.c + '::' + data.v);
  }

  async function packDecrypt(packed, keyHex) {
    if (!keyHex) throw new Error('Manglende nøkkel');
    try {
      const raw = atob(packed);
      const parts = raw.split('::');
      const iv = new Uint8Array(parts[0].split('').map(c => c.charCodeAt(0)));
      const ct = new Uint8Array(parts[1].split('').map(c => c.charCodeAt(0)));
      const keyBytes = new Uint8Array(keyHex.match(/.{2}/g).map(h => parseInt(h, 16)));
      const aes = new AESGCM(keyBytes);
      const dec = aes.decrypt(iv, ct);
      return fromUint8Array(dec);
    } catch (e) {
      return '[Kunne ikke dekryptere]';
    }
  }

  return { generateKey, packEncrypt, packDecrypt };
})();
