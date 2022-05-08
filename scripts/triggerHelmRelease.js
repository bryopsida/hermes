const { Octokit } = require('@octokit/rest')
const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPOSITORY
const owner = process.env.GITHUB_REPOSITORY_OWNER
const octokit = new Octokit({
  auth: token
})
octokit.rest.repos.createDispatchEvent({
  owner: owner,
  repo: repo,
  event_type: 'helm-release',
  client_payload: {}
}).then(() => {
  console.log('Created dispatch for helm release...')
}).catch((err) => {
  console.error('Error while creating dispatch for helm release: ', err)
  process.exit(1)
})
