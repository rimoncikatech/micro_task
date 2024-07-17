const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello From  Micro Service A. Great::!! ');
});

app.listen(port, () => {
  console.log(`Service A listening at http://localhost:${port}`);
});
