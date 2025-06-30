import { loginAgent, fetchEkycUser } from '../services/agentService.js';
import { getEkycUserData,createEkycUserData,getEkycDocument,createEkycDocument,createDocumentBase64   } from '../services/eKYCService.js';
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

    const orgExternal = await getExternalReferenceByInternal(meta.institution);
    // put user request with new column
    const data = await getEkycUserData(meta.idType, meta.idNumber, orgExternal.toLowerCase());

    

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
    const resp = await createEkycUserData(body,externalRef);
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


export async function handleCreateDocument (req, res) {
  console.log("===========================================================================")
  console.log("Handle Created Document called")
  console.log("getting request is files ",req.files)
  console.log("getting request is body",req.body)
  console.log("===========================================================================")
  try {
    /* ---------- validate required text fields ---------- */
    const { username_employee, organization_id } = req.body;

    if (!username_employee || !organization_id) {
      return res.status(400).json({
        status : 'BAD_REQUEST',
        message: 'username_employee and organization_id are required',
        content: null,
      });
    }

    /* ---------- mutate req.body *in-place* ---------- */
    // 1. Title-case the username
    req.body.username_employee = username_employee
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

    // 2. map internal → external org-id
    const orgExternal = await getExternalReferenceByInternal(organization_id);
    if (!orgExternal) {
      return res.status(404).json({
        status : 'NOT_FOUND',
        message: 'organization_id is invalid',
        content: null,
      });
    }
    req.body.organization_id = orgExternal.toLowerCase();

    /* ---------- delegate, passing the *whole* request object ---------- */
    const resp = await createEkycDocument(req);   // req now carries updated body + any files

    // Check if response contains an error or a failure message
    if (!resp || resp?.message !== 'Static document fields set successfully') {
      return res.status(400).json({
        status : 'FAIL',
        message: 'Document not created',
        content: null,
      });
    }

    return res.status(200).json({
      status : 'SUCCESS',
      message: resp?.message || 'Document created successfully',
      content: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status : 'ERROR',
      message: 'Internal server error',
      content: err.message || err,
    });
  }
}


export async function handleCreateDocumentBase64 (req, res) {
  try {
    const {
      username_employee,
      organization_id,
      id,
      id_type,
      ...possibleDocs            // document01 … document10 may or may not be present
    } = req.body || {};

    // basic validation
    if (!username_employee || !organization_id || !id || !id_type) {
      return res.status(400).json({
        status : 'BAD_REQUEST',
        message: 'username_employee, organization_id, id and id_type are required',
        content: null,
      });
    }

    // map org internal → external
    const orgExternal = await getExternalReferenceByInternal(organization_id);
    if (!orgExternal) {
      return res.status(404).json({
        status : 'NOT_FOUND',
        message: 'organization_id is invalid',
        content: null,
      });
    }

    // collect only the present document fields
    const documents = {};
    for (let i = 1; i <= 10; i++) {
      const key = `document${String(i).padStart(2, '0')}`; // document01 … document10
      if (possibleDocs[key]) documents[key] = possibleDocs[key];
    }

    const payload = {
      id,
      id_type,
      username_employee,
      organization_id : orgExternal.toLowerCase(),
      documents,
    };

    const resp = await createDocumentBase64(payload,organization_id);    // service call

    if (resp?.message === 'success') {
      return res.status(201).json({
        status : 'SUCCESS',
        message: 'Document created successfully',
        content: null,
      });
    }

    return res.status(400).json({
      status : 'FAIL',
      message: 'Document not created',
      content: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status : 'ERROR',
      message: 'Internal server error',
      content: err.message || err,
    });
  }
}


// export async function handleCreateDocument (req, res) {
//   try {
//     /* ---------- validate required text fields ---------- */
//     const { username_employee, organization_id } = req.body;

//     if (!username_employee || !organization_id) {
//       return res.status(400).json({
//         status : 'BAD_REQUEST',
//         message: 'username_employee and organization_id are required',
//         content: null,
//       });
//     }

//     /* ---------- mutate req.body *in-place* ---------- */
//     // 1. Title-case the username
//     req.body.username_employee = username_employee
//       .toLowerCase()
//       .replace(/\b\w/g, c => c.toUpperCase());

//     // 2. map internal → external org-id
//     const orgExternal = await getExternalReferenceByInternal(organization_id);
//     if (!orgExternal) {
//       return res.status(404).json({
//         status : 'NOT_FOUND',
//         message: 'organization_id is invalid',
//         content: null,
//       });
//     }
//     req.body.organization_id = orgExternal.toLowerCase();

//     /* ---------- delegate, passing the *whole* request object ---------- */
//     const resp = await createEkycDocument(req);   // req now carries updated body + any files

//     return res.status(200).json({
//       status : 'SUCCESS',
//       message: resp?.message || 'Document created',
//       content: null,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       status : 'ERROR',
//       message: 'Internal server error',
//       content: err.message || err,
//     });
//   }
// }




// export async function handleCreateDocument (req, res) {
//   try {
//     // body fields come via multer (upload.none()) – strings only
//     console.log(req)
//     // console.log(req.body)
//     // console.log(req.files)
//     let {
//       username_employee,
//       organization_id,
//       ...rest
//     } = req.body;

//     if (!username_employee || !organization_id) {
//       return res.status(400).json({
//         status : 'BAD_REQUEST',
//         message: 'username_employee and organization_id are required',
//         content: null,
//       });
//     }

//     // 1) transform username_employee (example: Title-case)
//     username_employee = username_employee
//       .toLowerCase()
//       .replace(/\b\w/g, (c) => c.toUpperCase());

    
//     // 2) convert organization_id (internal → external)
//     let orgExternal = await getExternalReferenceByInternal(organization_id);
//     if (!orgExternal) {
//       return res.status(404).json({
//         status : 'NOT_FOUND',
//         message: 'organization_id is invalid',
//         content: null,
//       });
//     }
//     orgExternal =orgExternal.toLowerCase()

//     // 3) assemble final payload
//     const payload = {
//       ...rest,             // any other form fields
//       username_employee : username_employee,
//       organization_id: orgExternal,
//     };

//     // 4) delegate to service layer
//     const resp = await createEkycDocument(payload);

//     return res.status(200).json({
//       status : 'SUCCESS',
//       message: resp?.message || 'Document created',
//       content: null,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       status : 'ERROR',
//       message: 'Internal server error',
//       content: err,
//     });
//   }
// }