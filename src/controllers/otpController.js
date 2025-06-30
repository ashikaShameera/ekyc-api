import { getEmail } from '../services/eKYCService.js';
import { requestOtp, verifyOtp } from '../services/otpService.js';
import { verifyToken } from '../services/tokenService.js';
import { maskEmail } from '../utils/common.js';

export async function handleRequestOtp (req, res) {
  let { idType, idValue, institutionCode } = req.body || {};
  if (!idType || !idValue || !institutionCode) {
    return res.status(400).json({
      status  : 'BAD_REQUEST',
      message : 'idType, idValue & institutionCode are required',
      content : null,
    });
  }

  try {
    const user = await getEmail(idType, idValue, institutionCode);
    if (!user) {
      return res.status(200).json({
        status  : 'NOT_FOUND',
        message : 'No matching user',
        content : null,
      });
    }
    idType = (idType || '').trim().toUpperCase();
    const { token, otpLength } = await requestOtp({
      idType, idValue, institutionCode, ...user,
    });
    // console.log(user.email)
    return res.status(200).json({
      status  : 'SUCCESS',
      message : 'OTP sent',
      content : {
        token,
        length   : otpLength,
        time_out : Number(process.env.OTP_TTL_SECONDS || 300),
        masked_email:maskEmail(user.email)
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'ERROR', message: 'Internal server error', content: null });
  }
}



export async function handleVerifyOtp (req, res) {

  const authHeader = req.headers['authorization'];
  const otp = req.body?.otp;
  
  // Validate token and otp
  if (!authHeader || !authHeader.startsWith('Bearer ') || !otp) {
    return res.status(400).json({
      status: 'BAD_REQUEST',
      message: 'Authorization header with Bearer token and OTP are required',
      content: null,
    });
  }

    // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1];
  console.log(token)
  try {
    const payload = verifyToken(token);
    const DATA_QUERY_TOKEN = await verifyOtp({ tokenPayload: payload, otp });
    if (!DATA_QUERY_TOKEN) {
      return res.status(400).json({ status: 'FAIL', message: 'Invalid OTP', content: null });
    }

      return res.status(200).json({
    status: 'SUCCESS',
    message: 'OTP verified',
    content: { data_query_token: DATA_QUERY_TOKEN }
  });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ status: 'FAIL', message: err.message, content: null });
  }
}


// export async function handleVerifyOtp (req, res) {
//   const { token, otp } = req.body || {};
//   if (!token || !otp) {
//     return res.status(400).json({
//       status  : 'BAD_REQUEST',
//       message : 'token & otp are required',
//       content : null,
//     });
//   }

//   try {
//     const payload = verifyToken(token);
//     const ok = await verifyOtp({ tokenPayload: payload, otp });
//     if (!ok) {
//       return res.status(400).json({ status: 'FAIL', message: 'Invalid OTP', content: null });
//     }

//     return res.status(200).json({ status: 'SUCCESS', message: 'OTP verified', content: null });
//   } catch (err) {
//     console.error(err);
//     return res.status(400).json({ status: 'FAIL', message: err.message, content: null });
//   }
// }