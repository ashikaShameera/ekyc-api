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



async function fetchFullKycDetails(token, idType, idNumber) {
  const url = `${BASE_URL}kyc-full/${idNumber}/${idType.toLowerCase()}/${KYC_USERNAME}`;

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 8000,
  });

  return data;          // return the whole payload; caller decides what to send on
}




export async function getEkycUserData(idType, idNumber, institution) {
  // 1) use cached token first
  let token = await getAccessToken();
  try {
    return await fetchFullKycDetails(token, idType, idNumber);
  } catch (err) {
    if (!isTokenError(err)) {
      console.error('getEkycUserData error:', err.response?.data || err.message);
      return null;
    }
  }

  // 2) token expired/invalid → hard refresh & retry once
  try {
    const fresh = await performLogin();      // refresh + persist
    token = fresh.access_token;
    return await fetchFullKycDetails(token, idType, idNumber);
  } catch (err) {
    console.error('getEkycUserData after refresh error:', err.response?.data || err.message);
    return null;
  }
}



export async function getEkycDocument(idType, idValue, cid) {
  // 1) first try with cached token
  let token = await getAccessToken();
  try {
    return await fetchDocumentDetails(token, idType, idValue, cid);
  } catch (err) {
    if (!isTokenError(err)) {
      console.error('getEkycDocument error:', err.response?.data || err.message);
      return null;
    }
  }

  // 2) token invalid/expired → hard refresh & retry once
  try {
    const fresh = await performLogin();      // refresh + persist
    token = fresh.access_token;
    return await fetchDocumentDetails(token, idType, idValue, cid);
  } catch (err) {
    console.error('getEkycDocument after refresh error:', err.response?.data || err.message);
    return null;
  }
}


async function fetchDocumentDetails(token, idType, idValue, cid) {
  const url = `${BASE_URL}ekyc/documents/${idValue}/${idType.toLowerCase()}/${KYC_USERNAME}/${cid}`;

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 8000,
  });

  return data;          // entire document payload
}

// https://kyc.bethel.network/api/v1/ekyc/documents/{{id}}/{{id_type}}/{{username}}/{{cid}}
// https://kyc.bethel.network/api/v1/ekyc/documents/{id}/{id_type}/{username}/{cid}
    // https://kyc.bethel.network/api/v1/kyc-full/955070078v/nic/{{x-username}}
    // // go to BC_EKYC_USER_REQUEST and get ID_TYPE and ID_NUMBER


export async function createEkycUserData(ekycUserData) {
    console.log("called createEkycUserData")
    console.log(ekycUserData.organization_id)
    console.log(ekycUserData)
    return ("creatin suceess")
}
