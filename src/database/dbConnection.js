const mysql = require('mysql2');

require('dotenv').config();

const pool = mysql.createPool({
  socketPath: process.env.INSTANCE_UNIX_SOCKET,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'HeroHub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
