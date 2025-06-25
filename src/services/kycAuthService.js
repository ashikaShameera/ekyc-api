import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import { getTokens, saveTokens } from '../utils/tokenFileStore.js';

const {
  KYC_LOGIN_URL,
  KYC_USERNAME,
  KYC_PASSWORD,
  KYC_DEVICE,
  KYC_IP_ADDRESS,
} = process.env;

/**
 * Do the POST /users/login call →
 * return { access_token, refresh_token }.
 */

export async function performLogin () {
  const body = {
    username   : KYC_USERNAME,
    password   : KYC_PASSWORD,
    device     : KYC_DEVICE,
    ip_address : KYC_IP_ADDRESS,
  };

  const { data } = await axios.post(KYC_LOGIN_URL, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10_000,
  });

  const tokens = {
    access_token  : data.access_token,
    refresh_token : data.refresh_token,
  };

  // Save the tokens immediately
  await saveTokens(KYC_USERNAME, tokens);

  return tokens;
}


/**
 * Ensure we have a token pair cached.
 * Strategy:   – if nothing stored → login  
 *             – otherwise just reuse what we have
 * You can extend this to handle expiration with `refresh_token`.
 */
export async function getAccessToken () {
  const cached = await getTokens(KYC_USERNAME);
  if (cached?.access_token) {
    return cached.access_token;          // happy path
  }

  // no cache → fresh login
  const fresh = await performLogin();
  await saveTokens(KYC_USERNAME, fresh);
  return fresh.access_token;
}

