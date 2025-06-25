import { getConnection } from '../config/db.js';
import { getAccessToken, performLogin} from './kycAuthService.js';
import axios from 'axios';
import dotenv from 'dotenv';


const BASE_URL      = 'https://kyc.bethel.network/api/v1/';
const { KYC_USERNAME = 'privilegedUser4' } = process.env;



async function fetchContactDetails(token, idType, idValue) {
  const url = `${BASE_URL}contact-details-user-kyc`;
  const payload = {
    id       : idValue,
    id_type  : idType.toLowerCase(),
    username : KYC_USERNAME,
  };

  const { data } = await axios.post(url, payload, {
    headers: {
      Authorization : `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 8000,
  });

  // API returns contactno/email in opposite fields (per your earlier mapping)
  return {
    email  : data.contactno,
    mobile : data.email,
  };
}

/**
 * Detects whether the caught error is due to an invalid/expired token.
 */
function isTokenError(err) {
  const status  = err.response?.status;
  const message = err.response?.data?.error || err.message || '';
  return status === 401 || /invalid.*token|expired/i.test(message);
}

/*────────────────────────── MAIN ──────────────────────────*/
export async function getEmail(idType, idValue, institutionCode) {
  // 1) first attempt with cached token
  let token = await getAccessToken();
  try {
    return await fetchContactDetails(token, idType, idValue);
  } catch (err) {
    if (!isTokenError(err)) {
      console.error('getEmail error:', err.response?.data || err.message);
      return null;
    }
  }

  // 2) token invalid/expired → refresh & retry once
  try {
    const fresh = await performLogin();          // refreshes and persists
    token = fresh.access_token;
    return await fetchContactDetails(token, idType, idValue);
  } catch (err) {
    console.error('getEmail after refresh error:', err.response?.data || err.message);
    return null;
  }
}

export async function getEkycUserData(idType, idNumber, institution) {



    console.log("called getEkycUser with token",idType, idNumber, institution)
    return {"ss":"sssss"}
}


    // https://kyc.bethel.network/api/v1/kyc-full/955070078v/nic/{{x-username}}
    // // go to BC_EKYC_USER_REQUEST and get ID_TYPE and ID_NUMBER

export async function createEkycUserData(ekycUserData) {
    console.log("called createEkycUserData")
    console.log(ekycUserData)

    return ("creatin suceess")
}
