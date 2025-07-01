// import oracledb from 'oracledb';
// import dotenv from 'dotenv';
// dotenv.config();

// oracledb.autoCommit = false;                // leave explicit commits in the code

// export async function getConnection () {
//   console.log('Connecting to DB with:', {
//   user: process.env.DB_USER,
//   connectString: process.env.DB_CONNECTION_STRING,
// });

//   return oracledb.getConnection({
//     user              : process.env.DB_USER,
//     password          : process.env.DB_PASSWORD,
//     connectString     : process.env.DB_CONNECTION_STRING,
//   });
// }
import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config();

oracledb.autoCommit = false;

export async function getConnection () {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
  };

  console.log('Connecting to DB with:', {
    user: config.user,
    connectString: config.connectString,
  });

  try {
    const connection = await oracledb.getConnection(config);
    console.log('✅ Called to Oracle DB successfully');
    return connection;
  } catch (err) {
    console.error('❌ Failed to connect to Oracle DB:', err.message);
    throw err; // rethrow so calling code can handle it too
  }
}
