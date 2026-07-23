import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

// Master key should be 32 bytes. If not configured, use a fallback for local testing.
const MASTER_KEY = process.env.ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.ENCRYPTION_KEY, "salt", KEY_LENGTH)
  : crypto.scryptSync("cortex-default-master-key-change-in-prod", "salt", KEY_LENGTH);

/**
 * Encrypts cleartext using AES-256-GCM.
 * @param {string} text 
 * @returns {string} iv:tag:ciphertext formatted string
 */
export function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypts ciphertext back to cleartext.
 * @param {string} encryptedText 
 * @returns {string} cleartext
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return "";
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
