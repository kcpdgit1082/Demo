import CryptoJS from 'crypto-js';

/**
 * Encrypts data using AES encryption with the user's email as the key
 */
export function encryptData(data: string, email: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, email).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES decryption with the user's email as the key
 */
export function decryptData(encryptedData: string, email: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, email);
    const text = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!text) {
      throw new Error('Decryption returned empty string');
    }
    
    return text;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypts an object by converting it to JSON first
 */
export function encryptObject<T>(obj: T, email: string): string {
  const jsonString = JSON.stringify(obj);
  return encryptData(jsonString, email);
}

/**
 * Decrypts a string and parses it as JSON
 */
export function decryptObject<T>(encryptedData: string, email: string): T {
  const decrypted = decryptData(encryptedData, email);
  return JSON.parse(decrypted) as T;
}
