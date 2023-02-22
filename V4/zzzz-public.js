require('dotenv').config()
const express = require('express')

const app = express()
app.use(express.json())

// const { createPrivateKey } = require('crypto')
const { V4 } = require('paseto')


// privateKey = process.env.ACCESS_TOKEN_SECRET

const crypto = require("crypto");
 //generate encrypted privateKey
 const {publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', 
      {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: ''
  }
});


const key = crypto.createPrivateKey({  
    key: privateKey,
    format: "pem",
    type: "pkcs1",
    passphrase: "",
    encoding: "utf-8"
})

const payload = {
    'urn:example:claim': 'foo'
  }
  

const signing = V4.sign(payload, key)

signing.then(response=> console.log(response))

app.listen(8080)

