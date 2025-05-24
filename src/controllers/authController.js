require('dotenv').config();
const admin = require('firebase-admin');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

const SIGNIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
const SEND_RESET_EMAIL_URL = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;

function generateToken(uid, isAdmin) {
    return jwt.sign({ uid, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
}
async function register(req, res) {
    const { email, username, password, confirmPassword, isAdmin = false, profileImage } = req.body;
    if (!email || !username || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Barcha maydonlar to‘ldirilishi shart.' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Parollar mos emas.' });
    }

    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username
        });
        const uid = userRecord.uid;

        const newUser = new User({
            uid,
            email,
            username,
            isAdmin,
            profileImage: profileImage || 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await admin.firestore().collection('Users').doc(uid).set(newUser.toJSON());

        const token = generateToken(uid, isAdmin);
        return res.status(201).json({ uid, token });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email va parol kerak.' });
    }

    try {
        const { data } = await axios.post(SIGNIN_URL, {
            email,
            password,
            returnSecureToken: true
        });

        const doc = await admin.firestore().collection('Users').doc(data.localId).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
        }

        const { isAdmin = false } = doc.data();
        const token = generateToken(data.localId, isAdmin);
        return res.json({ uid: data.localId, token });
    } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        return res.status(401).json({ error: msg });
    }
}

async function getUser(req, res) {
    const { uid } = req.params;
    try {
        const doc = await admin.firestore().collection('Users').doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
        }
        return res.json(doc.data());
    } catch {
        return res.status(503).json({ error: 'Xizmat vaqtiinchalik mavjud emas.' });
    }
}


const { getStorage } = require('firebase-admin/storage');
const path = require('path');

async function updateUser(req, res) {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: 'UID kiritilishi shart.' });

    try {
        const userRef = admin.firestore().collection('Users').doc(uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

        const updates = { ...req.body };

        if (req.file) {
            const bucket = getStorage().bucket();
            const filename = `profileImages/${uid}_${Date.now()}${path.extname(req.file.originalname)}`;
            const file = bucket.file(filename);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype },
                public: true
            });

            updates.profileImage = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        }

        const updatedUser = new User({ ...userSnap.data(), ...updates });
        await userRef.set(updatedUser.toJSON(), { merge: true });

        return res.status(200).json({ success: true, updatedFields: updatedUser.toJSON() });
    } catch (err) {
        console.error('updateUser error:', err);
        return res.status(503).json({ error: 'Xizmat vaqtiinchalik mavjud emas.' });
    }
}




async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email kiritilishi shart.' });
    }

    try {
        await admin.auth().getUserByEmail(email);
    } catch (err) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
    }

    try {
        await axios.post(SEND_RESET_EMAIL_URL, {
            requestType: 'PASSWORD_RESET',
            email
        });
        return res.json({ ok: true });
    } catch (err) {
        console.error('Error sending reset email:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Email yuborishda xato yuz berdi.' });
    }
}

async function checkIsAdmin(req, res) {
    const { uid } = req.query;
    if (!uid) {
        return res.status(400).json({ error: 'UID kiritilishi shart.' });
    }

    try {
        const doc = await admin.firestore().collection('Users').doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
        }
        const { isAdmin = false } = doc.data();
        return res.status(200).json({ isAdmin });
    } catch (err) {
        console.error('checkIsAdmin error:', err);
        return res.status(500).json({ error: 'Server xatosi.' });
    }
}

module.exports = {
    register,
    login,
    getUser,
    updateUser,
    forgotPassword,
    checkIsAdmin
};