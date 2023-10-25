const axios = require('axios');
const crypto = require('crypto');

// Define your API keys
const publicKey = '74bf7f7fb78ba016a3176fdd7b14f420';
const privateKey = 'b17e64859983396bb77e7c0bd8925b43b1422d43'

// Construct the URL with query parameters
const baseUrl = 'https://gateway.marvel.com/v1/public/characters';
const timestamp = Date.now();
// const hash = /* Create your hash here */;
const hash = crypto.createHash('md5')
    .update(timestamp + privateKey + publicKey)
    .digest('hex');

const params = {
    ts: timestamp,
    apikey: publicKey,
    hash: hash,

};

// Make the HTTP GET request
const response = axios.get(baseUrl, { params })
    .then(response => {
        // Handle the API response here
        console.log(response.data);
    })
    .catch(error => {
        // Handle errors
        console.error(error);
    });

const characters = response.data.results;

characters.forEach(character => {
    console.log(`Name: ${character.name}`);
    console.log(`Description: ${character.description}`);
    // Access other properties as needed
});

characters



