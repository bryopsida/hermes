const options = {
  host: process.env.TEST_HOST || 'localhost',
  port: process.env.TEST_PORT || '3000',
  proto: process.env.TEST_PROTO || 'http'
}
export default options
