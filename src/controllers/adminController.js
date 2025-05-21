const admin = require('firebase-admin');

async function listUsers(req, res) {
    try {
        const snap = await admin.firestore()
            .collection('Users')
            .where('isAdmin', '==', false)
            .get();

        const users = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.json(users);
    } catch (err) {
        console.error('Error fetching non-admin users:', err);
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

    const reqSnap = await admin.firestore()
        .collection('RepairRequests')
        .where('uid', '==', uid)
        .get();

    const batch = admin.firestore().batch();
    reqSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return res.json({ success: true });
}

async function notifyOtherRequestByEmail(req, res) {
    const { id } = req.params;
    const { price, adminMessage } = req.body;

    if (!price || !adminMessage) {
        return res.status(400).json({ error: 'price va adminMessage talab qilinadi.' });
    }

    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        return res.status(404).json({ error: 'So‘rov topilmadi.' });
    }

    const data = doc.data();

    if (data.problemType !== 'other') {
        return res.status(400).json({ error: 'Faqat "other" turdagi so‘rovlar uchun bu amal bajariladi.' });
    }

    const userSnap = await admin.firestore().collection('Users').doc(data.uid).get();
    if (!userSnap.exists) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
    }
    const user = userSnap.data();

    await admin.firestore().collection('mail').add({
        to: user.email,
        message: {
            subject: `Other muammo yangilandi - So‘rov ID: ${id}`,
            text: `Hurmatli foydalanuvchi,

Siz yuborgan \"Other\" turdagi muammo ko‘rib chiqildi.
Muammo: ${data.issueName}
Narx: $${price}
Admin izohi: ${adminMessage}

Agar siz bu narxga rozimisiz, profilingizdagi tasdiqlash tugmasi orqali javob bering. Tasdiqlashsiz bu so‘rov yakunlanmaydi.

Hurmat bilan,
DERN Support`
        }
    });

    await docRef.update({ price, adminMessage, status: 'PRICE_SENT' });

    return res.json({ success: true, notified: true });
}

async function updateRequest(req, res) {
    const { id } = req.params;
    const { status, price, adminMessage } = req.body;

    const docRef = admin.firestore().collection('RepairRequests').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        return res.status(404).json({ error: 'So‘rov topilmadi.' });
    }
    const data = doc.data();

    if (status === 'DONE' && data.problemType === 'other') {
        if (!data.price || !data.adminMessage) {
            return res.status(400).json({
                error: 'Narx va admin izohi mavjud emas. Avval foydalanuvchiga maʼlumot yuborilishi kerak.'
            });
        }
        if (data.status !== 'CONFIRMED') {
            return res.status(400).json({
                error: 'Foydalanuvchi hali narxni tasdiqlamagan. So‘rovni yakunlash mumkin emas.'
            });
        }
    }
    const updates = {};
    if (status) updates.status = status;
    if (price != null && !isNaN(price)) updates.price = price;
    if (adminMessage && adminMessage.trim()) updates.adminMessage = adminMessage;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Yangilanish mavjud emas.' });
    }

    await docRef.update(updates);
    return res.json({ success: true });
}

async function listAllRequests(req, res) {
    try {
        const collection = admin.firestore().collection('RepairRequests');
        let query;
        if (req.query.status) {
            query = collection
                .where('status', '==', req.query.status)
                .orderBy('createdAt', 'desc');
        } else {
            query = collection.orderBy('createdAt', 'desc');
        }

        const snap = await query.get();

        const requests = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json(requests);
    } catch (err) {
        console.error('Request error:', err);

        if (err.code === 9 && err.details && err.details.includes('requires an index')) {
            return res.status(500).json({
                error: 'Firestore indeks talab qilmoqda.',
                indexLink: 'https://console.firebase.google.com/v1/r/project/important-documents-91534/firestore/indexes?create_composite=CmBwcm9qZWN0cy9pbXBvcnRhbnQtZG9jdW1lbnRzLTkxNTM0L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9SZXBhaXJSZXF1ZXN0cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC'
            });
        }

        return res.status(500).json({
            error: 'So‘rovlarni olishda xatolik yuz berdi.'
        });
    }
}

module.exports = {
    listUsers,
    deleteUser,
    updateRequest,
    notifyOtherRequestByEmail,
    listAllRequests
};