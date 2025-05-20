require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucketName = admin.app().options.storageBucket;
console.log('My bucket is:', bucketName);

const app = express();
app.use(cors());
app.use(express.json());

// Swagger setup
const { swaggerUi, swaggerSpec } = require('./src/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routers
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const userRoutes = require('./src/routes/user');

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
