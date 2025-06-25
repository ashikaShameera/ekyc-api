import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const STORE_PATH = path.resolve(process.env.KYC_TOKEN_STORE || './tokens.json');

/**
 * Safely read token JSON (returns {} if file is missing / invalid).
 */
export async function readStore () {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};                 // file doesn’t exist or malformed
  }
}

/**
 * Persist the whole object atomically.
 */
export async function writeStore (obj) {
  const json = JSON.stringify(obj, null, 2);
  await fs.writeFile(STORE_PATH, json, 'utf8');
}

/**
 * Get the saved token bundle for a username (or null).
 */
export async function getTokens (username) {
  const store = await readStore();
  return store[username] || null;
}

/**
 * Save / overwrite {access_token, refresh_token, updated_at} for a username.
 */
export async function saveTokens (username, tokens) {
  const store = await readStore();
  store[username] = { ...tokens, updated_at: new Date().toISOString() };
  await writeStore(store);
}
