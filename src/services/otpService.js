import { generateNumericOtp } from '../utils/generateOtp.js';
import { insertOtp, findActiveOtp, markOtpVerified } from '../models/otpModel.js';
import { insertRequest, updateRequestStatus } from '../models/ekycRequestModel.js';
import { signToken } from './tokenService.js';

export async function requestOtp ({ idType, idValue, institutionCode, email, mobile }) {
  // 1.  create REQ row (PEND)
  const reqId = await insertRequest({
    idType, idValue, institution: institutionCode, mobile, email, status: 'PEND',
  });

  // 2.  generate & store OTP
  const otp = generateNumericOtp(6);
  await insertOtp({ reqId, otp });              // STATUS = 'SEND'
  console.log("opt =",otp)
  // 3.  mark request as 'SEND'
  await updateRequestStatus(reqId, 'SEND');

  // 4.  send mail / SMS
  //    — your own sendEmail() function assumed available
  // eslint-disable-next-line no-use-before-define
//   await sendEmail({ to: email, subject: 'Your eKYC OTP', text: `Your OTP is ${otp}` });
  console.log("email sent")
  // here need to write email service
  // 5.  create token
  const token = signToken({ idType, idValue, institutionCode, reqId });

  return { token, otpLength: otp.length };
}

/**
 * Verifies user-submitted OTP.  Returns boolean.
 */
export async function verifyOtp ({ tokenPayload, otp }) {
  const { reqId } = tokenPayload;
  
  // fetch matching OTP row
  const otpRowId = await findActiveOtp(reqId, otp);
  if (!otpRowId) return false;

  // mark OTP + REQUEST as verified
  await markOtpVerified(otpRowId);
  const DATA_QUERY_TOKEN=await updateRequestStatus(reqId, 'VERIFY');

  return DATA_QUERY_TOKEN;
}
