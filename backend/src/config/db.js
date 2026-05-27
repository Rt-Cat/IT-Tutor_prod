const oracledb = require('oracledb');

// Oracle DB configuration
const dbConfig = {
  user: process.env.DB_USER || 'ADMIN',
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/FREEPDB1',
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60
};

let pool = null;

async function initializePool() {
  try {
    // Set Oracle client options
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    oracledb.autoCommit = true;
    
    pool = await oracledb.createPool(dbConfig);
    console.log('Oracle connection pool created successfully');
    
    // Test connection
    const connection = await pool.getConnection();
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('Database connection test successful:', result.rows[0]);
    await connection.close();
    
    return pool;
  } catch (error) {
    console.error('Error creating connection pool:', error);
    throw error;
  }
}

async function getConnection() {
  if (!pool) {
    throw new Error('Connection pool not initialized');
  }
  return await pool.getConnection();
}

async function closePool() {
  if (pool) {
    try {
      await pool.close(10);
      console.log('Connection pool closed');
    } catch (error) {
      console.error('Error closing connection pool:', error);
    }
  }
}

// Execute query helper
async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options
    });
    return result;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Execute with CLOB support
async function executeWithClob(sql, binds = {}, options = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    return result;
  } catch (error) {
    console.error('CLOB query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

module.exports = {
  initializePool,
  getConnection,
  closePool,
  executeQuery,
  executeWithClob,
  oracledb
};
