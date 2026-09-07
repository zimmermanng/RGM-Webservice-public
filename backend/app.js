const express = require('express')
const app = express()
const port = process.env.REACT_APP_BACKEND_PORT | 3011

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})