const options = {
  host: process.env.TEST_HOST || 'localhost',
  port: process.env.TEST_PORT || '3000',
  proto: process.env.TEST_PROTO || 'http',
  requestConfig: {
    auth: {
      username: process.env.TEST_USERNAME || 'admin',
      password: process.env.TEST_PASSWORD || 'admin'
    }
  }
}
export default options
