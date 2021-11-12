const {Pool} = require('pg')

const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'ooad_backend',
    password: '11912726',
    port: 5432,
    max: 20, // 连接池最大连接数
    idleTimeoutMillis: 3000, // 连接最大空闲时间 3s
};

const pool = new Pool(dbConfig)

module.exports = {
    query: (text, params, callback) => pool.query(text, params, callback),
    getResRows: (text, params) => pool.query(text, params)
}