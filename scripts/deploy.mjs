#!/usr/bin/env node

const token = process.env.DIGITALOCEAN_ACCESS_TOKEN
const appId = process.env.DO_APP_ID

if (!token) {
  console.error('Error: DIGITALOCEAN_ACCESS_TOKEN is not set')
  process.exit(1)
}
if (!appId) {
  console.error('Error: DO_APP_ID is not set')
  console.error('Find your app ID at: https://cloud.digitalocean.com/apps')
  console.error('Or run: curl -s -H "Authorization: Bearer $DIGITALOCEAN_ACCESS_TOKEN" \\')
  console.error('  https://api.digitalocean.com/v2/apps | node -e "process.stdin.resume();let d=\'\';process.stdin.on(\'data\',c=>d+=c);process.stdin.on(\'end\',()=>JSON.parse(d).apps?.forEach(a=>console.log(a.id,a.spec.name)))"')
  process.exit(1)
}

console.log(`Triggering deployment for app ${appId}...`)

const res = await fetch(`https://api.digitalocean.com/v2/apps/${appId}/deployments`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ force_build: false }),
})

if (!res.ok) {
  const err = await res.json().catch(() => ({}))
  console.error(`Error ${res.status}:`, err.message ?? JSON.stringify(err))
  process.exit(1)
}

const { deployment } = await res.json()
console.log(`Deployment created: ${deployment.id}`)
console.log(`Status: ${deployment.phase}`)
console.log(`Track progress: https://cloud.digitalocean.com/apps/${appId}/deployments/${deployment.id}`)
