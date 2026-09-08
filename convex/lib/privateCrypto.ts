export const MAX_PRIVATE_FILE_BYTES = 10 * 1024 * 1024;
export const PDF = "application/pdf";
export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => Uint8Array.from(s.match(/../g) ?? [], b => parseInt(b, 16));
export function validateMetadata(meta: { fileName: string; mimeType: string; size: number; purpose?: string }) {
 if (!Number.isSafeInteger(meta.size) || meta.size < 8 || meta.size > MAX_PRIVATE_FILE_BYTES) throw new Error("Invalid file size; maximum 10 MiB");
 if (!meta.fileName.trim() || meta.fileName.length > 255 || /[\x00-\x1f\/\\]/.test(meta.fileName)) throw new Error("Invalid filename");
 const ext = meta.fileName.toLowerCase().split(".").pop();
 const purpose = meta.purpose ?? "agreement";
 const legacyDoc = ["resume", "proposal"].includes(purpose) && ext === "doc" && meta.mimeType === "application/msword";
 const image = purpose === "credential" && ((["jpg", "jpeg"].includes(ext ?? "") && meta.mimeType === "image/jpeg") || (ext === "png" && meta.mimeType === "image/png"));
 if (!(legacyDoc || image || (ext === "pdf" && meta.mimeType === PDF) || (purpose !== "credential" && ext === "docx" && meta.mimeType === DOCX))) throw new Error("File extension and type are not allowed for this upload purpose");
}
export function validateFile(bytes: Uint8Array, meta: { fileName: string; mimeType: string; size: number; purpose?: string }) {
 validateMetadata(meta);
 if (bytes.length !== meta.size) throw new Error("File size mismatch");
 if (meta.mimeType === "application/msword") {
  if (bytes.length < 512 || hex(bytes.slice(0, 8)) !== "d0cf11e0a1b11ae1" || hex(bytes.slice(28,30)) !== "feff") throw new Error("Invalid DOC signature"); return;
 }
 if (meta.mimeType === "image/png") {
  if (bytes.length < 45 || hex(bytes.slice(0,8)) !== "89504e470d0a1a0a" || hex(bytes.slice(-8)) !== "49454e44ae426082") throw new Error("Invalid PNG signature"); return;
 }
 if (meta.mimeType === "image/jpeg") {
  if (bytes.length < 12 || hex(bytes.slice(0,3)) !== "ffd8ff" || hex(bytes.slice(-2)) !== "ffd9") throw new Error("Invalid JPEG signature"); return;
 }
 const ascii = (b: Uint8Array) => new TextDecoder().decode(b);
 if (meta.mimeType === PDF) {
  if (!/^%PDF-1\.[0-9]|^%PDF-2\.0/.test(ascii(bytes.slice(0, 8)))) throw new Error("Invalid PDF signature");
  if (!ascii(bytes.slice(-2048)).includes("%%EOF")) throw new Error("Malformed PDF");
  return;
 }
 // Read the ZIP central directory, not a substring that an arbitrary ZIP can spoof.
 const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
 let end = -1;
 for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (d.getUint32(i, true) === 0x06054b50) { end = i; break; }
 if (end < 0 || d.getUint16(end + 4, true) || d.getUint16(end + 6, true) || end + 22 + d.getUint16(end + 20, true) !== bytes.length) throw new Error("Malformed DOCX archive");
 const count = d.getUint16(end + 10, true); let offset = d.getUint32(end + 16, true); let expanded = 0;
 if (!count || count > 4096 || offset + d.getUint32(end + 12, true) !== end) throw new Error("Malformed DOCX directory");
 const names = new Set<string>();
 for (let i = 0; i < count; i++) {
  if (offset + 46 > end || d.getUint32(offset, true) !== 0x02014b50) throw new Error("Malformed DOCX entry");
  const nameLen = d.getUint16(offset + 28, true), extra = d.getUint16(offset + 30, true), comment = d.getUint16(offset + 32, true);
  const next = offset + 46 + nameLen + extra + comment;
  if (next > end) throw new Error("Malformed DOCX entry");
  const name = ascii(bytes.slice(offset + 46, offset + 46 + nameLen));
  const local = d.getUint32(offset + 42, true), compressed = d.getUint32(offset + 20, true);
  if (name.includes("..") || name.startsWith("/") || names.has(name) || (d.getUint16(offset + 8, true) & 1) || local + 30 > offset || d.getUint32(local, true) !== 0x04034b50 || local + 30 + d.getUint16(local + 26, true) + d.getUint16(local + 28, true) + compressed > offset) throw new Error("Unsafe DOCX entry");
  expanded += d.getUint32(offset + 24, true); names.add(name); offset = next;
 }
 if (offset !== end || expanded > 100 * 1024 * 1024 || !names.has("[Content_Types].xml") || !names.has("word/document.xml") || names.has("word/vbaProject.bin")) throw new Error("Invalid DOCX content");
}
async function key(keyId?: string) {
 const value = process.env.PRIVATE_FILE_KEY ?? "";
 const configuredId = process.env.PRIVATE_FILE_KEY_ID;
 if (!/^[a-fA-F0-9]{64}$/.test(value) || !configuredId || (keyId && keyId !== configuredId)) throw new Error("Private file encryption key unavailable");
 return crypto.subtle.importKey("raw", unhex(value), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
export async function hashBytes(bytes: Uint8Array) { return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(bytes)))); }
export async function encryptFile(bytes: Uint8Array) {
 const encryptionKey = await key(); const nonce = crypto.getRandomValues(new Uint8Array(12)); const sha256 = await hashBytes(bytes);
 const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, additionalData: new TextEncoder().encode(sha256) }, encryptionKey, new Uint8Array(bytes)));
 return { ciphertext, nonce: hex(nonce), sha256, keyId: process.env.PRIVATE_FILE_KEY_ID! };
}
export async function decryptFile(ciphertext: Uint8Array, meta: { nonce: string; sha256: string; keyId: string }) {
 const bytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unhex(meta.nonce), additionalData: new TextEncoder().encode(meta.sha256) }, await key(meta.keyId), new Uint8Array(ciphertext)));
 if (await hashBytes(bytes) !== meta.sha256) throw new Error("Private file integrity failure");
 return bytes;
}
