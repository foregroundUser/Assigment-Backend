const admin = require('firebase-admin');
const RepairRequest = require('../models/RepairRequest');
const Feedback = require('../models/Feedback');
const bucket = admin.storage().bucket();

async function requestRepair(req, res) {
    const uid = req.user?.uid;
    const {issueName, problemType} = req.body;
    const files = req.files || [];

    if (!uid || !issueName || !problemType || files.length !== 2) {
        return res.status(400).json({error: 'Barcha maydonlar va 2 ta rasm kerak.'});
    }

    const isOther = problemType.toLowerCase() === 'other';
    const handler = isOther ? handleOther : handleStandard;
    return handler({req, res, uid});
}

async function handleOther({req, res, uid}) {
    const {issueName, description} = req.body;
    const files = req.files;
    if (!description?.trim()) {
        return res.status(400).json({error: 'Other uchun description kerak.'});
    }
    return createRequest({uid, issueName, problemType: 'other', isOther: true, description, price: null, files, res});
}

async function handleStandard({req, res, uid}) {
    const {issueName, problemType, price, description} = req.body;
    const files = req.files;
    if (price == null || isNaN(price)) {
        return res.status(400).json({error: 'Price kerak.'});
    }
    return createRequest({
        uid,
        issueName,
        problemType,
        isOther: false,
        description: description,
        price: parseFloat(price),
        files,
        res
    });
}

async function createRequest({uid, issueName, problemType, isOther, description, price, location, files, res}) {
    try {
        await admin.auth().getUser(uid);

        const imageUrls = await Promise.all(files.map(async file => {
            const filename = `requests/${uid}/${Date.now()}_${file.originalname}`;
            const ref = bucket.file(filename);
            await ref.save(file.buffer, {metadata: {contentType: file.mimetype}, public: true});
            return `https://storage.googleapis.com/${bucket.name}/${filename}`;
        }));

        const docRef = admin.firestore().collection('RepairRequests').doc();

        const newReq = new RepairRequest({
            id: docRef.id,
            uid,
            issueName,
            problemType,
            isOther,
            description,
            location, // ✅ yangi qo‘shilgan maydon
            status: 'WAITING',
            price,
            images: imageUrls,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await docRef.set(newReq.toJSON());
        return res.status(201).json(newReq.toJSON());
    } catch (err) {
        console.error('createRequest error:', err);
        return res.status(500).json({error: 'So‘rovni yaratishda xatolik.'});
    }
}

async function listUserRequests(req, res) {
    const uid = req.user?.uid;

    if (!uid) {
        return res.status(401).json({error: "Foydalanuvchi aniqlanmadi."});
    }

    try {
        const snap = await admin
            .firestore()
            .collection('RepairRequests')
            .where('uid', '==', uid)
            .get();

        const requests = snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis?.() || 0 // xavfsiz sorting uchun
            };
        });

        const sorted = requests.sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).json(sorted);
    } catch (error) {
        console.error("Error fetching user requests:", error);
        return res.status(500).json({error: "So‘rovlar ro‘yxatini olishda xatolik yuz berdi."});
    }
}

async function getMyMails(req, res) {
    const uid = req.user?.uid;
    const email = req.user?.email;
    const snap = await admin.firestore().collection('RepairRequests')
        .where('uid', '==', uid)
        .where('problemType', '==', 'other')
        .where('status', '==', 'PENDING')
        .get();

    const requests = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const mailSnap = await admin.firestore().collection('mail').get();
    const allMails = mailSnap.docs
        .map(doc => ({id: doc.id, ...doc.data()}))
        .filter(m => m.message?.to === email); // faqat shu user uchun

    const result = requests.map(req => {
        const foundMail = allMails.find(m => m.message?.subject?.includes(req.id));
        return {
            ...req,
            mailText: foundMail?.message?.text || null
        };
    });

    return res.status(200).json(result);
}


async function submitFeedback(req, res) {
    const uid = req.user?.uid;
    const {requestId, rating, comment} = req.body;
    if (!requestId || typeof rating !== 'number' || ![1, 2, 3, 4, 5].includes(rating)) {
        return res.status(400).json({error: 'Rating noto‘g‘ri.'});
    }

    const reqDoc = await admin.firestore().collection('RepairRequests').doc(requestId).get();
    if (!reqDoc.exists || reqDoc.data().uid !== uid || reqDoc.data().status !== 'DONE') {
        return res.status(400).json({error: 'Fikr-mulohaza uchun shartlar bajarilmagan.'});
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
async function getUserFeedbacks(req, res) {
    const uid = req.user?.uid;

    const snap = await admin.firestore().collection('Feedbacks')
        .where('uid', '==', uid)
        // .orderBy('createdAt', 'desc')
        .get();

    const feedbacks = snap.docs.map(doc => doc.data());
    return res.status(200).json({ feedbacks });
}

async function confirmOtherRequest(req, res) {
    const {id} = req.params;
    const uid = req.user?.uid;

    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({error: 'So‘rov topilmadi.'});

    const data = doc.data();
    if (data.uid !== uid || data.problemType !== 'other' || data.status !== 'PENDING') {
        return res.status(400).json({error: 'Tasdiqlash shartlari bajarilmagan.'});
    }

    await docRef.update({status: 'CONFIRMED'});
    return res.status(200).json({success: true});
}

async function deleteRequest(req, res) {
    const {id} = req.params;
    const uid = req.user?.uid;

    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().uid !== uid || doc.data().status !== 'WAITING') {
        return res.status(400).json({error: 'So‘rovni o‘chirishga ruxsat yo‘q.'});
    }
    await docRef.delete();
    return res.status(200).json({success: true});
}

async function getUserHistory(req, res) {
    const {uid} = req.params;
    try {
        const snap = await admin
            .firestore()
            .collection('RepairRequests')
            .where('uid', '==', uid)
            .get();

        const history = snap.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        return res.json(history);
    } catch (err) {
        console.error('History error:', err);
        return res.status(503).json({error: 'Tarixni olishda xato yuz berdi.'});
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


async function cancelPendingRequest(req, res) {
    const { id } = req.params;

    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return res.status(404).json({ error: 'So‘rov topilmadi.' });
    }

    const status = docSnap.data().status;
    if (status !== 'WAITING' && status !== 'PENDING') {
        return res.status(400).json({ error: 'Faqatgina kutishdagi yoki tasdiqlanmagan so‘rovni bekor qilish mumkin.' });
    }

    const batch = admin.firestore().batch();
    batch.delete(docRef);

    const mailSnap = await admin.firestore().collection('mail')
        .where('requestId', '==', id)
        .get();

    mailSnap.docs.forEach(mailDoc => batch.delete(mailDoc.ref));
    await batch.commit();

    return res.status(200).json({ success: true, message: 'So‘rov bekor qilindi.' });
}

module.exports = {
    requestRepair,
    listUserRequests,
    getMyMails,
    submitFeedback,
    confirmOtherRequest, getUserHistory,
    getUserProfile, deleteRequest,
    cancelPendingRequest,
    getUserFeedbacks
};
