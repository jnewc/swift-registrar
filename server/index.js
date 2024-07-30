import express from 'express'
import fs from 'fs'
import { Readable } from 'stream'
import http from 'http'
import https from 'https'

const app = express()

app.use((req, res, next) => {
  console.log(`[Request] ${req.path}`)
  next()
})


// [1] GET /:scope/:package

app.get('/:scope/:package', (req, res) => {
  const scope = req.params.scope
  const packageName = req.params.package

  const rootPath = `../registry/${scope}/${packageName}`
  const releasesPath = `${rootPath}/releases.json`

  const releaseExists = fs.existsSync(releasesPath)
  if (!releaseExists) {
    console.error(`${req.path} - 404: package does not exist at ${rootPath}`)
    res.status(404).send("Package not found")
    return
  }

  const responseBody = fs.readFileSync(releasesPath)
  try {
    JSON.parse(responseBody)
  } catch {
    console.error(`${req.path} - 500: release metadata was not valid JSON for package at ${rootPath}`)
    res.status(500).send("Invalid package release JSON")
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Version', '1')
  res.send(responseBody)
})

// [2] GET /:scope/:package/:version

app.get('/:scope/:package/:version', async (req, res) => {
  const scope = req.params.scope
  const packageName = req.params.package
  const version = req.params.version

  const rootPath = `../registry/${scope}/${packageName}/${version.replace(".zip", "")}`
  const releasePath = `${rootPath}/release.json`

  const releaseExists = fs.existsSync(releasePath)
  if (!releaseExists) {
    console.error(`${req.path} - 404: release does not exist at ${rootPath}`)
    res.status(404).send("Release not found")
    return
  }

  if (version.endsWith(".zip")) {
    await handleSourceRequest(scope, packageName, version, res)
    return
  }

  const responseBody = fs.readFileSync(releasePath)
  try {
    JSON.parse(responseBody)
  } catch {
    console.error(`${req.path} - 500: release metadata was not valid JSON for package at ${rootPath}`)
    res.status(500).send("Invalid package release JSON")
    return
  }

  console.log(responseBody.toString())

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Version', '1')
  res.status(200).send(responseBody)
})

// [3] GET /:scope/:package/:version/Package.swift

app.get('/:scope/:package/:version/Package.swift', async (req, res) => {
  const scope = req.params.scope
  const packageName = req.params.package
  const version = req.params.version

  const rootPath = `../registry/${scope}/${packageName}/${version}`
  const releasePath = `${rootPath}/release.json`

  const releaseExists = fs.existsSync(releasePath)
  if (!releaseExists) {
    console.error(`${req.path} - 404: release does not exist at ${rootPath}`)
    res.status(404).send("Release not found")
    return
  }

  try {
    const url = `https://raw.githubusercontent.com/${scope}/${packageName}/${version}/Package.swift`
    console.log(`Fetching: ${url}`)
    const response = await fetch(url)

    res.setHeader('Content-Type', 'text/x-swift')
    res.setHeader('Content-Version', '1')
    res.setHeader('Content-Disposition', 'attachment; filename="Package.swift"')
    res.status(200)
    Readable.fromWeb(response.body).pipe(res)
  } catch {
    console.error(`${req.path} - 500: Failed to fetch Package.swift`)
    res.status(500).send('Failed to fetch Package.swift')
  }
})

// [4] GET /:scope/:package/:version.zip

async function handleSourceRequest(scope, packageName, version, res) {
  // https://github.com/jnewc/Hue/archive/refs/tags/2.0.3.zip
  try {
    // TODO: naive - should try to stream instead
    const url = `https://github.com/${scope}/${packageName}/archive/refs/tags/${version}`
    console.log(`Fetching: ${url}`)
    const response = await fetch(url)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Version', '1')
    res.setHeader('Content-Disposition', `attachment; filename="${packageName}-${version}"`)
    res.status(200)
    Readable.fromWeb(response.body).pipe(res)
  } catch {
    console.error(`${req.path} - 500: Failed to fetch Package.swift`)
    res.status(500).send('Failed to fetch Package.swift')
  }
}

// [5] GET /identifiers?url={url}

app.get('/identifiers', (req, res) => {
  res.status(501).send('Not yet supported')
})

// [6] PUT /:scope/:package/:version

app.put('/:scope/:package/:version', (req, res) => {
  res.status(501).send('Not yet supported')
})

// middleware

app.use((req, res, next) => {
  console.log("RESPONSE: ")
  next()
})

// start server

// app.listen(3000)

var privateKey  = fs.readFileSync('ssl/server.key', 'utf8');
var certificate = fs.readFileSync('ssl/server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(3000);
httpsServer.listen(8443);