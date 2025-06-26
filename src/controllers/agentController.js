import { loginAgent, fetchEkycUser } from '../services/agentService.js';
import { getEkycUserData,createEkycUserData,getEkycDocument  } from '../services/eKYCService.js';
import { findByDataQueryToken } from '../models/ekycRequestModel.js';
import {
  getExternalReferenceByInternal
} from '../models/institutionAgentModel.js';

// ---------- /institution-agent/login ----------
export async function handleAgentLogin (req, res) {
  const { username, password, institution } = req.body || {};

  if (!username || !password || !institution) {
    return res.status(400).json({
      status : 'BAD_REQUEST',
      message: 'username, password & institution are required',
      content: null,
    });
  }

  try {
    const token = await loginAgent({ username, password, institution });

    if (!token) {
      return res.status(401).json({
        status : 'FAIL',
        message: 'Invalid credentials or inactive agent',
        content: null,
      });
    }

    return res.status(200).json({
      status : 'SUCCESS',
      message: 'Login successful',
      content: { token },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status : 'ERROR',
      message: 'Internal server error',
      content: null,
    });
  }
}

// ---------- /get-ekyc-user ----------
export async function handleGetEkycUser (req, res) {
  const { data_query_token } = req.body || {};

  if (!data_query_token) {
    return res.status(400).json({
      status : 'BAD_REQUEST',
      message: 'data_query_token is required',
      content: null,
    });
  }
  console.log("handle data")
  try {

    const meta = await findByDataQueryToken(data_query_token);

    if (!meta) {
        return res.status(404).json({
            status : 'NOT_FOUND',
            message: 'Invalid data_query_token',
            content: null,
        });
    }
    /// go to BC_EKYC_USER_REQUEST and get ID_TYPE and ID_NUMBER
    // here need to pass the ID_TYPE,ID_NUMBER,ID_NUMBER,INSTITUTION

    // put user request with new column
    const data = await getEkycUserData(meta.idType, meta.idNumber, meta.institution);

    

    console.log(data_query_token)
    // update user request with new column status of new column
    return res.status(200).json({
      status : 'SUCCESS',
      message: 'Data retrieved',
      content: data,               // might be null/empty – depends on the service
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status : 'ERROR',
      message: 'Internal server error',
      content: null,
    });
  }
}



export async function handleGetDocument (req, res) {
  const {idType,idValue, cid } = req.body || {};

  if (!cid |!idValue| !idType) {
    return res.status(400).json({
      status : 'BAD_REQUEST',
      message: 'cid, idValue, and idType are required',
      content: null,
    });
  }

  try {
    const docData = await getEkycDocument(idType,idValue, cid);   // ← call the service-layer helper

    if (!docData ) {
      return res.status(404).json({
        status : 'NOT_FOUND',
        message: 'Document not found',
        content: null,
      });
    }

    return res.status(200).json({
      status : 'SUCCESS',
      message: 'Document retrieved',
      content: docData,          // whatever the service returns
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status : 'ERROR',
      message: 'Internal server error',
      content: null,
    });
  }
}


/* ---------- /create-ekyc ---------- */
export async function handleCreateEkyc(req, res) {
  let body = req.body || {};
  // console.log("called create ekyc", body);
  console.log("organization_id:", body.organization_id);
  console.log("username:", body.username);

  try {
    // Step 1: Lookup external reference
    let externalRef = await getExternalReferenceByInternal(body.organization_id);
    externalRef = externalRef.toLowerCase();
    console.log(externalRef)
    // Step 2: If not found, return 400 error
    if (!externalRef) {
      return res.status(400).json({
        status: 'BAD_REQUEST',
        message: 'Organization not found',
        content: null,
      });
    }

    // Step 3: Replace internal with external reference
    body.organization_id = externalRef;
    // Step 4: Proceed with creation
    const resp = await createEkycUserData(body);
    // need to handle below this accordinlly to getting respones
    return res.status(200).json({
      status: 'SUCCESS',
      message: resp?.message || 'KYC record created Successful',
      content: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Internal server error',
      content: null,
    });
  }
}