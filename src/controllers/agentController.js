import { loginAgent, fetchEkycUser } from '../services/agentService.js';

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
  const { token: jwt, data_query_token } = req.body || {};

  if (!jwt || !data_query_token) {
    return res.status(400).json({
      status : 'BAD_REQUEST',
      message: 'token & data_query_token are required',
      content: null,
    });
  }

  try {
    const data = await fetchEkycUser({ jwt, dataQueryToken: data_query_token });

    if (!data) {
      return res.status(401).json({
        status : 'FAIL',
        message: 'Token invalid, expired or agent inactive',
        content: null,
      });
    }

    return res.status(200).json({
      status : 'SUCCESS',
      message: 'Data retrieved',
      content: data,
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
