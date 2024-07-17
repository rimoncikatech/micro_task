const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3001;

const serviceAUrl = process.env.SERVICE_A_URL;

app.get('/', async (req, res) => {
  try {
    const response = await axios.get(serviceAUrl);
    res.send(`Service B received: ${response.data}`);
  } catch (error) {
    res.send('Error connecting to Service A');
  }
});

app.get('/health', (req, res) => {
    res.json({ status: 'UP' });
});


app.listen(port, () => {
  console.log(`Service B listening at http://localhost:${port}`);
});
