const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/password-reset', require('./routes/passwordReset'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/records', require('./routes/records'));
app.use('/api/accountants', require('./routes/accountants'));
app.use('/api/audit', require('./routes/audit'));

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
    
    // Start background auto sync scheduler
    require('./utils/scheduler').startAutoSync();
  })
  .catch(err => console.error(err));
