/**
 * for handling routes to the express server
 * will mostly share the public folder
 */
const path = require('path');
const express = require('express')
const app = express()


const publicPath = path.join(__dirname, '..', 'public')
app.use(express.static(publicPath))


module.exports = app