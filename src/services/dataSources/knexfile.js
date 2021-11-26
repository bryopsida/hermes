module.exports = {
    development: {
        client: 'pg',
        connection: {
             user: 'postgres', 
             database: '',
             password: '',
             host: 'localhost' 
        }
    },
    production: { 
        client: 'pg', 
        connection: {
            user: process.env.PG_USER,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            host:  process.env.PG_HOST 
       }
    }
};