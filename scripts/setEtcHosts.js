const fs = require('fs')

const hostname = process.argv.slice(2, 3)
const ipAddress = process.argv.slice(3, 4)
const isWin = process.platform === 'win32'
const hostFile = !isWin ? '/etc/hosts' : 'C:/Windows/System32/drivers/etc/hosts'

console.log(`Detected host file location: ${hostFile}, hostname: ${hostname}, ipAddress: ${ipAddress}`)

fs.readFile(hostFile, (err, data) => {
  if (err) throw err
  const lines = data.toString().split('\n')
    .map((line) => line.trim())
    .filter((line) => line.indexOf(hostname) === -1 && line.trim().length > 0)
    .concat(`${ipAddress} ${hostname}\n`)
  fs.writeFile(hostFile, lines.join('\n'), (writeErr) => {
    if (writeErr) throw writeErr
    console.log('Done!')
  })
})
