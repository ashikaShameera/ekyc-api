import { loginAgent, fetchEkycUser } from '../services/agentService.js';
import { getEkycUserData,createEkycUserData,getEkycDocument  } from '../services/eKYCService.js';
import { findByDataQueryToken } from '../models/ekycRequestModel.js';


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
  const { cid } = req.body || {};

  if (!cid) {
    return res.status(400).json({
      status : 'BAD_REQUEST',
      message: 'cid is required',
      content: null,
    });
  }

  try {
    const docData = await getEkycDocument(cid);   // ← call the service-layer helper

    if (!docData) {
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
export async function handleCreateEkyc (req, res) {
  // console.log(req)
  // const { firstName, lastName, nic, documents } = req.body || {};
  const body=req.body || {};
  // console.log("request is",req)
  // if (
  //   !firstName || !lastName || !nic ||
  //   !documents?.nic_front || !documents?.nic_back
  // ) {
  //   return res.status(400).json({
  //     status : 'BAD_REQUEST',
  //     message: 'firstName, lastName, nic and both NIC images are required',
  //     content: null,
  //   });
  // }

  try {
    // here batter to pass req body
    const resp = await createEkycUserData(body);

    return res.status(200).json({
      status : 'SUCCESS',
      message: resp?.message || 'KYC record created Successful',
      content: null,
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