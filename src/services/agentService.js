import { signToken, verifyToken } from './tokenService.js';
import {
  findByCredentials,
  updateToken,
  findByUsername,
} from '../models/institutionAgentModel.js';

import { getEkycUserData } from './eKYCService.js';      // <-- already exists per spec

// ---------- LOGIN ----------
export async function loginAgent ({ username, password, institution }) {
  const agentRow = await findByCredentials({ username, password, institution });
  if (!agentRow) return null;                       // invalid creds / inactive

  // make JWT (payload: just the username)
  const jwt = signToken({ username });

  // persist token in DB
  await updateToken({ username, token: jwt });

  return jwt;
}

// ---------- TOKEN VALIDATION & DATA FETCH ----------
export async function fetchEkycUser ({ jwt, dataQueryToken }) {
  const payload = verifyToken(jwt);                 // throws if tampered / expired
  const { username } = payload;

  const agentRow = await findByUsername(username);
  if (
    !agentRow ||                                  // not found
    agentRow.STATUS !== 'ACT' ||                  // inactive
    agentRow.TOKEN !== jwt                        // stale / mismatched token
  ) {
    return null;
  }

  // All checks passed – call downstream eKYC data service
  const data = await getEkycUserData(dataQueryToken);
  return data;                                     // may be null/undefined; controller decides
}
