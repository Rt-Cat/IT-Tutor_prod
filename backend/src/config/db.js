const oracledb = require('oracledb');
require('dotenv').config();
oracledb.fetchAsString = [oracledb.CLOB];
// Enforce standard JSON key-value extraction structures automatically
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initializePool() {
  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMax: 12,
    poolMin: 2,
    poolIncrement: 1
  });
}

async function execute(sql, binds = {}, options = {}) {
  let connection;
  // Standardize automatic commit behaviors for structural updates unless explicitly overrode
  options.autoCommit = options.autoCommit !== false;
  options.outFormat = options.outFormat || oracledb.OUT_FORMAT_OBJECT;
  try {
    connection = await pool.getConnection();
    if (Array.isArray(binds)) {
      throw new Error("Execute function received an array as 'binds'. Expected an object.");
    }
    const result = await connection.execute(sql, binds, options);
    return result;
  } catch (err) {
    console.error(`[Oracle Database Exception]: ${err.message}`);
    console.error(`[Oracle Database Exception]: ${err.message}`);
    console.error(`SQL: ${sql}`);
    console.error(`Binds:`, JSON.stringify(binds, null, 2));
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error reverting connection block to active pool:', closeErr);
      }
    }
  }
}

module.exports = { initializePool, execute };