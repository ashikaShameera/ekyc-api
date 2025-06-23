import { getConnection } from '../config/db.js';
import oracledb from 'oracledb';

export async function insertRequest ({
  idType, idValue, institution, mobile, email, status = 'PEND'
}) {
  const sql = `
    INSERT INTO BC_EKYC_USER_REQUEST (
      ID_TYPE, ID_NUMBER, INSTITUTION,
      MOBILE_NO, EMAIL, STATUS
    )
    VALUES (:idType, :idValue, :institution, :mobile, :email, :status)
    RETURNING REQ_ID INTO :reqId
  `;
  const binds = { idType, idValue, institution, mobile, email, status, reqId: { dir: 3003, type: oracledb.NUMBER } }; // 3003 = oracledb.BIND_OUT, 2 = NUMBER
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, binds);
    await conn.commit();
    return result.outBinds.reqId[0];
  } finally {
    await conn.close();
  }
}

export async function updateRequestStatus (reqId, status) {
  const sql = 'UPDATE BC_EKYC_USER_REQUEST SET STATUS = :status, UPDATED_AT = CURRENT_TIMESTAMP WHERE REQ_ID = :reqId';
  const conn = await getConnection();
  try {
    await conn.execute(sql, { status, reqId });
    await conn.commit();
  } finally {
    await conn.close();
  }
}
