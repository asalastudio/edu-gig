// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { encryptFile, decryptFile, validateFile } from "../../convex/lib/privateCrypto";
afterEach(() => vi.unstubAllEnvs());
describe("private transport", () => {
 it("encrypts exact bytes with distinct nonces and rejects tampering or absent keys", async () => {
  vi.stubEnv("PRIVATE_FILE_KEY", "11".repeat(32)); vi.stubEnv("PRIVATE_FILE_KEY_ID", "test-v1");
  const bytes = new TextEncoder().encode("%PDF-1.7\nexact original bytes\n%%EOF");
  const a = await encryptFile(bytes); const b = await encryptFile(bytes);
  expect(a.nonce).not.toBe(b.nonce); expect(a.sha256).toBe(b.sha256);
  expect(await decryptFile(a.ciphertext, a)).toEqual(bytes);
  a.ciphertext[0] ^= 1; await expect(decryptFile(a.ciphertext, a)).rejects.toThrow();
  vi.stubEnv("PRIVATE_FILE_KEY", ""); await expect(encryptFile(bytes)).rejects.toThrow("key");
 });
 it("validates signatures, extension, declared size and 10 MiB bound including above Vercel buffer cap", async () => {
  const bytes = new Uint8Array(5 * 1024 * 1024); bytes.set(new TextEncoder().encode("%PDF-1.7\n"));
  bytes.set(new TextEncoder().encode("%%EOF"), bytes.length - 5);
  const meta = { fileName: "scope.pdf", mimeType: "application/pdf", size: bytes.length };
  expect(() => validateFile(bytes, meta)).not.toThrow();
  expect(() => validateFile(bytes, { ...meta, fileName: "scope.docx" })).toThrow();
  expect(() => validateFile(bytes, { ...meta, size: 1 })).toThrow();
  expect(() => validateFile(new Uint8Array(10 * 1024 * 1024 + 1), meta)).toThrow();
  expect(() => validateFile(new TextEncoder().encode("malware"), { ...meta, size: 7 })).toThrow();
 });
});
