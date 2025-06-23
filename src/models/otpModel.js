import { getConnection } from '../config/db.js';

export async function insertOtp ({ reqId, otp, type = 'EMAIL', status = 'SEND' }) {
  const sql = `
    INSERT INTO BC_EKYC_USER_OTP (
      REQ_ID, OTP_TYPE, OTP_NUMBER, STATUS
    )
    VALUES (:reqId, :type, :otp, :status)
  `;
  const conn = await getConnection();
  try {
    await conn.execute(sql, { reqId, type, otp, status });
    await conn.commit();
  } finally {
    await conn.close();
  }
}

export async function findActiveOtp (reqId, otp) {
  const sql = `
    SELECT ID
    FROM   BC_EKYC_USER_OTP
    WHERE  REQ_ID = :reqId
      AND  OTP_NUMBER = :otp
      AND  STATUS    = 'SEND'
  `;
  const conn = await getConnection();
  try {
    const res = await conn.execute(sql, { reqId, otp });
    return res.rows.length ? res.rows[0][0] : null;
  } finally {
    await conn.close();
  }
}

export async function markOtpVerified (id) {
  const sql = 'UPDATE BC_EKYC_USER_OTP SET STATUS = \'VERIFY\', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id';
  const conn = await getConnection();
  try {
    await conn.execute(sql, { id });
    await conn.commit();
  } finally {
    await conn.close();
  }
}
