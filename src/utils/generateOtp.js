import crypto from 'crypto';

export function generateNumericOtp (digits = 6) {
  const max = 10 ** digits;
  const otp = crypto.randomInt(0, max).toString().padStart(digits, '0');
  return otp;
}
