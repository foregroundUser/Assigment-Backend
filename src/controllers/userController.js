const admin = require('firebase-admin');
const RepairRequest = require('../models/RepairRequest');
const bucket = admin.storage().bucket();
const Feedback = require('../models/Feedback');
async function requestRepair(req, res) {
    const {uid, issueName, problemType, description, price} = req.body;
    const files = req.files || [];
    if (!uid || !issueName || !problemType || files.length !== 2) {
        return res.status(400).json({
            error: 'uid, issueName, problemType va 2 ta rasm kerak.'
        });
    }
    const isOther = problemType === 'other' || problemType === 'Other';
    if (isOther) {
        return handleOther(req, res);
    } else {
        return handleStandard(req, res);
    }
}

async function handleOther(req, res) {
    const {uid, issueName, description} = req.body;
    const files = req.files;

    if (!description || !description.trim()) {
        return res.status(400).json({
            error: 'Other tanlanganda description kiritilishi shart.'
        });
    }

    return createRequest({
        uid,
        issueName,
        problemType: 'other',
        isOther: true,
        description: description.trim(),
        price: null,
        files,
        res
    });
}

async function handleStandard(req, res) {
    const {uid, issueName, problemType, price} = req.body;
    const files = req.files;

    if (price == null || isNaN(price)) {
        return res.status(400).json({
            error: 'Non-other bo‘lganida price kiritilishi shart.'
        });
    }

    return createRequest({
        uid,
        issueName,
        problemType,
        isOther: false,
        description: null,
        price: parseFloat(price),
        files,
        res
    });
}


async function createRequest({uid, issueName, problemType, isOther, description, price, files, res}) {
    try {
        await admin.auth().getUser(uid);
    } catch {
        return res.status(404).json({error: 'Foydalanuvchi topilmadi.'});
    }

    let imageUrls;
    try {
        const uploads = files.map(async file => {
            const filename = `requests/${uid}/${Date.now()}_${file.originalname}`;
            const ref = bucket.file(filename);
            await ref.save(file.buffer, {
                metadata: {contentType: file.mimetype},
                public: true
            });
            return `https://storage.googleapis.com/${bucket.name}/${filename}`;
        });
        imageUrls = await Promise.all(uploads);
    } catch (err) {
        console.error(err);
        return res.status(500).json({error: 'Rasm yuklashda xatolik.'});
    }

    const docRef = admin.firestore().collection('RepairRequests').doc();
    const newReq = new RepairRequest({
        id: docRef.id,
        uid,
        issueName,
        problemType,
        isOther,
        description,
        status: 'PENDING',
        price,
        images: imageUrls,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await docRef.set(newReq.toJSON());
    return res.status(201).json(newReq.toJSON());
}

async function listUserRequests(req, res) {
    const {uid} = req.params;
    try {
        const snap = await admin.firestore()
            .collection('RepairRequests')
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();

        const requests = snap.docs.map(d => d.data());
        return res.json(requests);
    } catch (err) {
        console.error('Error fetching user requests:', err);
        return res.status(503).json({error: 'So‘rovlar ro‘yxatini olishda xato.'});
    }
}

async function getUserProfile(req, res) {
    const {uid} = req.params;
    try {
        const doc = await admin.firestore().collection('Users').doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({error: 'Foydalanuvchi profili topilmadi.'});
        }
        return res.json(doc.data());
    } catch (err) {
        console.error('Error fetching user profile:', err);
        return res.status(503).json({error: 'Profilni olishda xato yuz berdi.'});
    }
}

async function getUserHistory(req, res) {
    const {uid} = req.params;
    try {
        const snap = await admin.firestore()
            .collection('RepairRequests')
            .where('uid', '==', uid)
            .get();

        const history = snap.docs
            .map(d => d.data())
            .sort((a, b) => {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });

        return res.json(history);
    } catch (err) {
        console.error('History error:', err);
        return res.status(503).json({error: 'Tarixni olishda xato yuz berdi.'});
    }
}


async function submitFeedback(req, res) {
    const {uid, requestId, rating, comment} = req.body;
    if (!uid || !requestId || typeof rating !== 'number' || ![1, 2, 3, 4, 5].includes(rating)) {
        return res.status(400).json({error: 'uid, requestId va 1–5 orasida rating kerak.'});
    }

    const reqDoc = await admin.firestore().collection('RepairRequests').doc(requestId).get();
    if (!reqDoc.exists) {
        return res.status(404).json({error: 'So‘rov topilmadi.'});
    }
    const reqData = reqDoc.data();
    if (reqData.uid !== uid) {
        return res.status(403).json({error: 'Bu so‘rov sizga tegishli emas.'});
    }
    if (reqData.status !== 'DONE') {
        return res.status(400).json({error: 'Faqat yakunlangan so‘rovga fikr-mulohaza berish mumkin.'});
    }

    const fbRef = admin.firestore().collection('Feedbacks').doc();
    const fb = new Feedback({
        id: fbRef.id,
        uid,
        requestId,
        rating,
        comment: comment || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await fbRef.set(fb.toJSON());
    return res.status(201).json(fb.toJSON());
}

async function deleteRequest(req, res) {
    const {id} = req.params;
    const {uid} = req.body;

    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        return res.status(404).json({error: 'So‘rov topilmadi.'});
    }
    const data = doc.data();

    if (data.uid !== uid) {
        return res.status(403).json({error: 'Bu so‘rov sizga tegishli emas.'});
    }

    if (data.status !== 'PENDING') {
        return res.status(400).json({error: 'Faqat PENDING holatidagi so‘rovni o‘chirishingiz mumkin.'});
    }

    await docRef.delete();
    return res.json({success: true});
}


module.exports = {
    requestRepair,
    listUserRequests,
    getUserProfile,
    getUserHistory,
    submitFeedback,
    deleteRequest
};
