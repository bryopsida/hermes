const dns = require('dns')

const hostname = process.argv.slice(2, 3)[0]

dns.resolve4(hostname, (err, addresses) => {
  if (err) throw err
  console.log(addresses[0])
})
