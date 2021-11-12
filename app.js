const express = require('express')
const path  = require('path')
const router = require('./router')
const session = require('express-session')
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

const app = express()

app.engine('html', require('express-art-template'))
app.use('/public/', express.static(path.join(__dirname, './public/')))
app.use('/node_modules/', express.static(path.join(__dirname, './node_modules/')))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(session({
    secret: 'fk nvidia',
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: { maxAge: 300000 }
}))
app.use(cookieParser())
app.use(router)

app.listen(5000, function () {
    console.log('running...')
})



