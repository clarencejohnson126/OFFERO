// Portabler Base64-Encoder (UTF-8). Vermeidet Node-`Buffer`/`btoa`, damit der Kern
// in jedem Client läuft. Wird für die Arbeitsagentur-API gebraucht (refnr → base64-Pfadsegment).

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64Encode(input: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const n = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    out += ALPHABET[(n >> 18) & 63] ?? '';
    out += ALPHABET[(n >> 12) & 63] ?? '';
    out += b1 === undefined ? '=' : (ALPHABET[(n >> 6) & 63] ?? '');
    out += b2 === undefined ? '=' : (ALPHABET[n & 63] ?? '');
  }
  return out;
}
