import { getAccessToken, performLogin} from './kycAuthService.js';
import axios from 'axios';
import dotenv from 'dotenv';

import FormData from 'form-data';  // npm install form-data to handle form-data requests
import fs from 'fs';


const BASE_URL      = 'https://kyc.bethel.network/api/v1/';
const { KYC_USERNAME = 'privilegedUser4' } = process.env;
const HTTP_TIMEOUT =Number(process.env.KYC_HTTP_TIMEOUT_MS); 

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



async function fetchFullKycDetails(token, idType, idNumber,institution) {
  // console.log("------------institution------------ ",institution)
  const url = `${BASE_URL}get/kyc/full/${idNumber}/${idType.toLowerCase()}/${institution}/${KYC_USERNAME}`;

  // const url = `${BASE_URL}get/kyc/full/${idNumber}/${idType.toLowerCase()}/boc1/${KYC_USERNAME}`;
  console.log(url)

 const { data } = await axios.get(url, {
    headers: {
      Authorization : `Bearer ${token}`,
      // 'Content-Type': 'application/json',
    },
    timeout: HTTP_TIMEOUT,        // ← now driven by .env
  });
  console.log("response data is ",data)
  return data;          // return the whole payload; caller decides what to send on
}




export async function getEkycUserData(idType, idNumber, institution) {

  // 1) use cached token first
  let token = await getAccessToken();
  try {
    return await fetchFullKycDetails(token, idType, idNumber,institution);
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


/*──────────────── helper – POST  create-update ───────────────*/
async function postCreateOrUpdate(token, ekycUserData) {
  const url  = `${BASE_URL}create-update`;
  const body = { ...ekycUserData, username: KYC_USERNAME };

  const { data } = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    timeout: HTTP_TIMEOUT,                          // ← now honour .env
  });
  return data;
}

/*──────────────── MAIN – createEkycUserData ──────────────────*/
export async function createEkycUserData(ekycUserData,externalRef) {
  // 1) first try with cached token
  let token = await getAccessToken();
  try {
    return await postCreateOrUpdate(token, ekycUserData);
  } catch (err) {
    if (!isTokenError(err)) {
      console.error('createEkycUserData error:', err.response?.data || err.message);
      return null;
    }
  }

  // 2) token invalid/expired → hard refresh & retry once
  try {
    const fresh = await performLogin();      // refresh + persist
    token = fresh.access_token;
    return await postCreateOrUpdate(token, ekycUserData);
  } catch (err) {
    console.error('createEkycUserData after refresh error:', err.response?.data || err.message);
    return null;
  }
}




// export async function createEkycDocument(req) {
//   req.body.username_employee=KYC_USERNAME
//   console.log("ekyc documents",req.files)
//   console.log("ekyc documents",req.body)
// }


export async function createEkycDocument(req) {
  // console.log(req.files)
  console.log(req.body.id_type)
  try {
    // 1) Get the token for authorization header
    let token = await getAccessToken();
    console.log(req.body.username_employee)
    // 2) Create the form-data object
    const form = new FormData();
    form.append('id', req.body.id);                  // id (e.g., NIC number)
    form.append('id_type', req.body.id_type);        // id_type (e.g., NIC)
    form.append('username_employee', KYC_USERNAME); // employee username
    form.append('organization_id', req.body.organization_id);     // external organization id
    
    // 3) Attach files if any (assuming params.files is an object with file paths or buffers)
    if (req.files) {
      // Assuming params.files contains 'nicFront' (file)
      for (const [fileKey, file] of Object.entries(req.files)) {
        console.log("hiiiiiii")
        console.log("==========================================================")
        console.log(file)
        form.append(file.fieldname, file.buffer,file.originalname);
        // form.append(file);
      }
    }
    console.log("=============================== Form Object ============================================")
    console.log(form)

    // 4) Make the POST request to the Bethel API with Authorization and form-data
    const response = await axios.post(
      'https://kyc.bethel.network/api/v1/upload-update/documents',
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(), // Automatically sets the correct 'Content-Type' for form-data
        },
        timeout: HTTP_TIMEOUT,  // Use the HTTP_TIMEOUT set in the environment file
      }
    );

    // 5) Return response from API (success or failure message)
    console.log("respone is",response.data);  // Check the response if needed
    return response.data;        // Return data (you may modify how to handle this)
  } catch (err) {
    console.error('Error in createEkycDocument:', err.response?.data || err.message);
    return null; // Or you can return an error message as needed
  }
}

// https://kyc.bethel.network/api/v1/ekyc/documents/{{id}}/{{id_type}}/{{username}}/{{cid}}
// https://kyc.bethel.network/api/v1/ekyc/documents/{id}/{id_type}/{username}/{cid}
    // https://kyc.bethel.network/api/v1/kyc-full/955070078v/nic/{{x-username}}
    // // go to BC_EKYC_USER_REQUEST and get ID_TYPE and ID_NUMBER


// export async function createEkycUserData(ekycUserData) {
//   ekycUserData.username=KYC_USERNAME
//     console.log("called createEkycUserData")
//     console.log(ekycUserData.organization_id)
//     console.log(ekycUserData.username)

//     console.log(ekycUserData)
//     return ("creatin suceess")
// }

