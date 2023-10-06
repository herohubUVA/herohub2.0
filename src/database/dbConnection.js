const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '34.145.188.12',
  user: 'gchin',
  password: 'bobthecat123',
  database: 'HeroHub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
