const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = 3001;

app.use(cors());
app.use('/api', routes);

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 API listening on port 3001');
});
