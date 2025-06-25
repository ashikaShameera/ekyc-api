import { getConnection } from '../config/db.js';
import oracledb from 'oracledb';

import crypto from 'crypto';

export async function insertRequest ({
  idType, idValue, institution, mobile, email, status = 'PEND'
}) {
  console.log("called insert request aql")
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

export async function updateRequestStatus(reqId, status) {
  const dataQueryToken = crypto.randomUUID(); // or use any unique token generation logic

  const sql = `
    UPDATE BC_EKYC_USER_REQUEST
    SET STATUS = :status,
        DATA_QUERY_TOKEN = :dataQueryToken,
        UPDATED_AT = CURRENT_TIMESTAMP
    WHERE REQ_ID = :reqId
    RETURNING DATA_QUERY_TOKEN INTO :returnedToken
  `;

  const binds = {
    status,
    dataQueryToken,
    reqId,
    returnedToken: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
  };

  const conn = await getConnection();

  try {
    const result = await conn.execute(sql, binds);
    await conn.commit();
    return result.outBinds.returnedToken[0]; // ✅ return the new token
  } finally {
    await conn.close();
  }
}


export async function findByDataQueryToken (token) {
  const sql = `
    SELECT ID_TYPE, ID_NUMBER, INSTITUTION
      FROM BC_EKYC_USER_REQUEST
     WHERE DATA_QUERY_TOKEN = :token
  `;

  const conn = await getConnection();
  try {
    const res = await conn.execute(
      sql,
      { token },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    if (!res.rows.length) return null;

    const row = res.rows[0];              // {ID_TYPE, ID_NUMBER, INSTITUTION}
    return {
      idType     : row.ID_TYPE,
      idNumber   : row.ID_NUMBER,
      institution: row.INSTITUTION,
    };
  } finally {
    await conn.close();
  }
}