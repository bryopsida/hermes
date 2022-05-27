const yaml = require('yaml')
const fs = require('fs')

fs.readFile('./helm/hermes/Chart.yaml', {
  encoding: 'utf8'
}, (err, data) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  const chart = yaml.parse(data)
  const version = chart.version
  console.log('Current version:', version)
  const versionParts = version.split('.')
  const newVersion = `${versionParts[0]}.${versionParts[1]}.${parseInt(versionParts[2]) + 1}`
  console.log('New version:', newVersion)
  chart.version = newVersion
  const newChart = yaml.stringify(chart)
  fs.writeFile('./helm/hermes/Chart.yaml', newChart, {
    encoding: 'utf8'
  }, (writeErr) => {
    if (writeErr) {
      console.error('Error while writing updated chart: ', writeErr)
      process.exit(1)
    }
  })
})
