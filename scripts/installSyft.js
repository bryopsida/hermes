const https = require('https')
const fs = require('fs')
const crypto = require('crypto')
const { spawn } = require('child_process')
const { cwd } = require('process')

const hash = crypto.createHash('sha256')

const expectedHashes = [
  'a6dfabcd60ec8b09a8269d5efda8c797ad9657567cd723306f5cfc3fcb07b79b'
]

const INSTALL_SCRIPT = 'https://raw.githubusercontent.com/anchore/syft/main/install.sh'
const INSTALL_SCRIPT_PATH = '/tmp/syft-install.sh'
const REQUEST_FAILED_EXIT_CODE = 1
const SYFT_INSTALL_HASH_MISMATCH_EXIT_CODE = 2
const FAILED_TO_REMOVE_SCRIPT_EXIT_CODE = 3
const SYFT_INSTALL_FAILED_EXIT_CODE = 4

// fetch and hash the install script
const file = fs.createWriteStream(INSTALL_SCRIPT_PATH)

function installExitHandler (exitCode) {
  if (exitCode === 0) {
    console.log('Syft install script completed successfully')
  } else {
    console.error('Syft install script failed')
    process.exit(SYFT_INSTALL_FAILED_EXIT_CODE)
  }
  fs.unlink(INSTALL_SCRIPT_PATH, (unlinkErr) => {
    if (unlinkErr) {
      console.error('Failed to remove install script')
      process.exit(FAILED_TO_REMOVE_SCRIPT_EXIT_CODE)
    }
  })
}

const request = https.get(INSTALL_SCRIPT, (rsp) => {
  rsp.pipe(file)
  rsp.pipe(hash)

  rsp.on('end', () => {
    const digest = hash.digest('hex')
    // if its good run the install script
    if (expectedHashes.includes(digest)) {
      console.log('Syft install script hash verified, installing')
      fs.chmod(INSTALL_SCRIPT_PATH, '740', (chmodErr) => {
        if (chmodErr) {
          console.error('Failed to chmod install script')
          process.exit(4)
        }
        const child = spawn(INSTALL_SCRIPT_PATH, ['-b', '/usr/local/bin'], {
          shell: true,
          stdio: 'inherit',
          cwd: cwd()
        }, (err, stdout, stderr) => {
          if (err) {
            console.error(err)
            process.exit(2)
          }
        })
        child.on('exit', installExitHandler)
      })
    } else {
      console.warn('Syft install script hash mismatch, aborting install')
      process.exit(SYFT_INSTALL_HASH_MISMATCH_EXIT_CODE)
    }
  })
})

request.on('error', (err) => {
  console.error('Error fetching install script', err)
  process.exit(REQUEST_FAILED_EXIT_CODE)
})
