import crypto from 'crypto';

export function generateNumericOtp (digits = 6) {
  const max = 10 ** digits;
  //let otp = crypto.randomInt(0, max).toString().padStart(digits, '0');
  let otp="111111"
  return otp;
}
