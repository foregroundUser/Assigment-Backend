// controllers/adminController.js
const admin = require('firebase-admin');

async function listUsers(req, res) {
    try {
        const snap = await admin.firestore().collection('Users').where('isAdmin', '==', false).get();
        const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(503).json({ error: 'Xizmat vaqtiinchalik mavjud emas.' });
    }
}

async function deleteUser(req, res) {
    const { uid } = req.query;
    if (!uid) {
        return res.status(400).json({ error: 'UID talab qilinadi.' });
    }
    try {
        await admin.auth().deleteUser(uid);
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
        }
        return res.status(500).json({ error: 'Auth dan o‘chirishda xato.' });
    }

    await admin.firestore().collection('Users').doc(uid).delete();
    const reqSnap = await admin.firestore().collection('RepairRequests').where('uid', '==', uid).get();
    const batch = admin.firestore().batch();
    reqSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return res.json({ success: true });
}

async function notifyOtherRequestByEmail(req, res) {
    const { id } = req.params;
    const { price, adminMessage } = req.body;

    if (price == null || isNaN(price)) {
        return res.status(400).json({ error: 'Narx raqam bo‘lishi kerak.' });
    }

    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'So‘rov topilmadi.' });

    const data = doc.data();
    if (data.problemType !== 'other') return res.status(400).json({ error: 'Faqat other turdagi so‘rovlar uchun.' });
    if (data.status !== 'WAITING') return res.status(400).json({ error: 'So‘rov holati noto‘g‘ri.' });

    const userSnap = await admin.firestore().collection('Users').doc(data.uid).get();
    if (!userSnap.exists) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });

    const { uid } = userSnap.data();
    await admin.firestore().collection('mail').add({
        to: uid,
        message: {
            subject: `Other so‘rov narxi (ID: ${id})`,
            text: `${adminMessage}`
        }
    });
    await docRef.update({ price, status: 'PENDING' });
    return res.json({ success: true });
}

async function updateRequest(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'So‘rov topilmadi.' });

    const data = doc.data();
    if (data.problemType === 'other' && data.status !== 'CONFIRMED') {
        return res.status(400).json({ error: 'Narx tasdiqlanmagan.' });
    }
    await docRef.update({ status });
    return res.json({ success: true });
}
async function getAllFeedbackStats(req, res) {
    const snap = await admin.firestore().collection('Feedbacks').get();

    const statsMap = new Map();

    snap.docs.forEach(doc => {
        const { requestId, rating } = doc.data();
        if (!statsMap.has(requestId)) {
            statsMap.set(requestId, { total: 0, sum: 0 });
        }
        const stat = statsMap.get(requestId);
        stat.total += 1;
        stat.sum += rating;
        statsMap.set(requestId, stat);
    });

    const stats = Array.from(statsMap.entries()).map(([requestId, { total, sum }]) => ({
        requestId,
        totalFeedbacks: total,
        averageRating: +(sum / total).toFixed(2)
    }));

    return res.status(200).json({ stats });
}

async function listAllRequests(req, res) {
    try {
        let query = admin.firestore().collection('RepairRequests');
        if (req.query.status) {
            query = query.where('status', '==', req.query.status);
        }
        const snap = await query.get();
        const requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(requests);
    } catch (err) {
        console.error('Request error:', err);
        return res.status(500).json({ error: 'Xatolik yuz berdi.' });
    }
}

module.exports = {
    listUsers,
    deleteUser,
    notifyOtherRequestByEmail,
    updateRequest,
    listAllRequests,
    getAllFeedbackStats
};
