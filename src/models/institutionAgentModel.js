import { getConnection } from '../config/db.js';
import oracledb from 'oracledb';

export async function findByCredentials ({ username, password, institution }) {
  const sql = `
    SELECT AGENT_ID, USER_NAME, INSTITUTION, STATUS, TOKEN
    FROM   BC_INSTITUTION_AGENT
    WHERE  USER_NAME   = :username
      AND  PASSWORD    = :password
      AND  INSTITUTION = :institution
      AND  STATUS      = 'ACT'
  `;
  const conn = await getConnection();
  try {
    const res = await conn.execute(sql, { username, password, institution });
    return res.rows.length ? res.rows[0] : null;
  } finally {
    await conn.close();
  }
}

export async function updateToken ({ username, token }) {
  const sql = `
    UPDATE BC_INSTITUTION_AGENT
       SET TOKEN = :token,
           UPDATED_AT = CURRENT_TIMESTAMP
     WHERE USER_NAME = :username
  `;
  const conn = await getConnection();
  try {
    await conn.execute(sql, { username, token });
    await conn.commit();
  } finally {
    await conn.close();
  }
}

export async function findByUsername (username) {
  const sql = `
    SELECT USER_NAME, INSTITUTION, STATUS, TOKEN
    FROM   BC_INSTITUTION_AGENT
    WHERE  USER_NAME = :username
  `;
  const conn = await getConnection();
  try {
    const res = await conn.execute(sql, { username });
    return res.rows.length ? res.rows[0] : null;
  } finally {
    await conn.close();
  }
}


export async function getExternalReferenceByInternal(organizationId) {
  const sql = `
    SELECT REFRENCE_NUMBER_EXTERNAL
    FROM BC_INSTITUTION
    WHERE REFRENCE_NUMBER_INTERNAL = :organizationId
  `;

  const conn = await getConnection();

  try {
    const result = await conn.execute(
      sql,
      { organizationId: organizationId.trim() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].REFRENCE_NUMBER_EXTERNAL;
  } finally {
    await conn.close();
  }
}



// export async function getExternalReferenceByInternal(organizationId) {
//   organizationId='UNION_BANK_001'
//   const sql = `
//     SELECT REFRENCE_NUMBER_EXTERNAL
//     FROM BC_INSTITUTION
//     WHERE REFRENCE_NUMBER_INTERNAL = :organizationId
//   `;

//   const conn = await getConnection();

//   try {
//     const result = await conn.execute(sql, { organizationId }, { outFormat: 4001 }); // 4001 = oracledb.OUT_FORMAT_OBJECT

//     if (result.rows.length === 0) {
//       return null; // or throw new Error('Not found') depending on how you want to handle this
//     }

//     return result.rows[0].REFRENCE_NUMBER_EXTERNAL;
//   } finally {
//     await conn.close();
//   }
// }
