import { getConnection } from '../config/db.js';
import { getAccessToken, performLogin} from './kycAuthService.js';
import axios from 'axios';
import dotenv from 'dotenv';


const BASE_URL      = 'https://kyc.bethel.network/api/v1/';
const { KYC_USERNAME = 'privilegedUser4' } = process.env;

// const {
//       KYC_USERNAME
// } = process.env;
/**
 * Returns { email, mobile } or null if not found.
 * Feel free to tweak the SQL to match your real data source.
 */



// export async function getEmail(idType, idValue, institutionCode) {

//     let token = await getAccessToken();



//         try {
//         // 1) obtain/refresh access-token
//             let token = await getAccessToken();
//             if (!token) {
//             // optional hard-refresh
//             await performLogin();
//             token = await getAccessToken();
//         }
//         let i=await performLogin();
//         token=i.access_token

//         // 2) call KYC endpoint
//         const url = `${BASE_URL}contact-details-user-kyc`;
//         const payload = {
//         id       : idValue,
//         id_type  : idType.toLowerCase(),
//         username : KYC_USERNAME,
//         };

//         const { data } = await axios.post(url, payload, {
//         headers: {
//             Authorization : `Bearer ${token}`,
//             'Content-Type': 'application/json',
//         },
//         timeout: 8000,
//         });
//         console.log("=============")
        
//         if(data.error )
//             console.log(data.error)

//         return {
//             email: data.contactno,
//             mobile: data.email
//         };

//     } catch (err) {
//         console.error('getEmail error:', err.response?.data || err.message);
//         return null;
//     }

//     // // if this access token did not give results that token is ecpires i need to perform login and get freash token
//     // const fresh = await performLogin();
//     // await saveTokens(KYC_USERNAME, fresh);
//     // token=fresh.access_token
//     // console.log("my token is",token)

//     // // Here need to get customer email and phone number from the blockchain
//     // if (idType == "NIC" && idValue == "1" && institutionCode =="INS001") {
//     //     return {
//     //         email: "ashikashameera@gmail.com",
//     //         mobile: "0777973793" // Mobile as string to preserve leading 0
//     //     };

//     // }

//     // // Optional: Return null or throw error if no match found
//     // return null;
// }


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

    // go to BC_EKYC_USER_REQUEST and get ID_TYPE and ID_NUMBER
    console.log("called getEkycUser with token",idType, idNumber, institution)
    return {"ss":"sssss"}
}

export async function createEkycUserData(ekycUserData) {
    console.log("called createEkycUserData")
    console.log(ekycUserData)

    return ("creatin suceess")
}
