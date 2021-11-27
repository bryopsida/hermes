module.exports = {
    development: {
        client: 'pg',
        searchPath: ['tasks'],
        connection: {
             user: 'postgres', 
             database: '',
             password: '',
             host: 'localhost' 
        }
    },
    production: { 
        client: 'pg',
        searchPath: ['tasks'],
        connection: {
            user: process.env.PG_USER,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            host:  process.env.PG_HOST 
       }
    }
};