const admin = require('firebase-admin');
const axios = require('axios');
const User = require('../models/User');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const SIGNIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
const SEND_RESET_EMAIL_URL =
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;

async function checkIsAdmin(req, res) {
    const {uid} = req.body;
    if (!uid) {
        return res.status(400).json({error: 'UID kiritilishi shart.'});
    }

    try {
        const doc = await admin.firestore().collection('Users').doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({error: 'Foydalanuvchi topilmadi.'});
        }
        const {isAdmin = false} = doc.data();
        return res.json({isAdmin});
    } catch (err) {
        console.error('checkIsAdmin error:', err);
        return res.status(500).json({error: 'Server xatosi.'});
    }
}

async function forgotPassword(req, res) {
    const {email} = req.body;
    if (!email) {
        return res.status(400).json({error: 'Email kiritilishi shart.'});
    }

    try {
        await admin.auth().getUserByEmail(email);
    } catch (err) {
        return res.status(404).json({error: 'Foydalanuvchi topilmadi.'});
    }

    try {
        await axios.post(SEND_RESET_EMAIL_URL, {
            requestType: 'PASSWORD_RESET',
            email
        });
        return res.json({ok: true});
    } catch (err) {
        console.error('Error sending reset email:', err.response?.data || err.message);
        return res.status(500).json({error: 'Email yuborishda xato yuz berdi.'});
    }
}

async function register(req, res) {
    const {email, username, password, confirmPassword, isAdmin = false} = req.body;
    if (!email || !username || !password || !confirmPassword) {
        return res.status(400).json({error: 'Barcha maydonlar to‘ldirilishi shart.'});
    }
    if (password !== confirmPassword) {
        return res.status(400).json({error: 'Parollar mos emas.'});
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
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await admin.firestore().collection('Users').doc(uid).set(newUser.toJSON());

        return res.status(201).json({uid});
    } catch (err) {
        return res.status(400).json({error: err.message});
    }
}


async function login(req, res) {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({error: 'Email va parol kerak.'});
    }

    try {
        const {data} = await axios.post(SIGNIN_URL, {
            email,
            password,
            returnSecureToken: true
        });
        return res.json({uid: data.localId});
    } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        return res.status(401).json({error: msg});
    }
}


async function getUser(req, res) {
    const {uid} = req.params;
    try {
        const doc = await admin.firestore().collection('Users').doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({error: 'Foydalanuvchi topilmadi.'});
        }
        return res.json(doc.data());
    } catch {
        return res.status(503).json({error: 'Xizmat vaqtiinchalik mavjud emas.'});
    }
}


async function updateUser(req, res) {
    const {uid} = req.params;
    try {
        await admin.firestore().collection('Users').doc(uid).set(req.body, {merge: true});
        return res.json({success: true});
    } catch {
        return res.status(503).json({error: 'Xizmat vaqtiinchalik mavjud emas.'});
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
