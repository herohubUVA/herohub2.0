const mysql = require('mysql2');
require('dotenv').config();

let poolConfig;

if (process.env.NODE_ENV === 'production') {
    poolConfig = {
        socketPath: process.env.INSTANCE_UNIX_SOCKET,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: 'HeroHub',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
} else {
    poolConfig = {
        host: '34.145.188.12',
        user: 'gchin',
        password: 'bobthecat123',
        database: 'HeroHub',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool.promise();
