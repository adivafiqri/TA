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
  

// app.post('/login', (req,res) => {
//     const accessToken = V4.sign(payload, key)
   
//     // v4.public.eyJzdWIiOiJqb2huZG9lIiwiaWF0IjoiMjAyMS0wOC0wM1QwNTozOTozNy42NzNaIn3AW3ri7P5HpdakJmZvhqssz7Wtzi2Rb3JafwKplLoCWuMkITYOo5KNNR5NMaeAR6ePZ3xWUcbO0R11YLb02awO
//      res.json({accessToken: accessToken})
     
// })


const signing = V4.sign(payload, key)

signing.then(response=> console.log(response))

app.listen(8080)

