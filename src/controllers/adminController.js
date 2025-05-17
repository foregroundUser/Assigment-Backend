const admin = require('firebase-admin');

async function listUsers(req, res) {
    try {
        const snap = await admin.firestore().collection('Users').get();
        const users = snap.docs.map(d => d.data());
        return res.json(users);
    } catch (err) {
        return res.status(503).json({error: 'Xizmat vaqtiinchalik mavjud emas.'});
    }
}

async function deleteUser(req, res) {
    const {uid} = req.params;

    try {
        await admin.auth().deleteUser(uid);
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            return res.status(404).json({error: 'Foydalanuvchi topilmadi.'});
        }
        return res.status(500).json({error: 'Auth dan o‘chirishda xato.'});
    }

    await admin.firestore().collection('Users').doc(uid).delete();

    const reqSnap = await admin.firestore()
        .collection('RepairRequests')
        .where('uid', '==', uid)
        .get();

    const batch = admin.firestore().batch();
    reqSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return res.json({success: true});
}

    async function updateRequest(req, res) {
        const {id} = req.params;
        const {status, price, adminMessage} = req.body;

        const docRef = admin.firestore().collection('RepairRequests').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({error: 'So‘rov topilmadi.'});
        }
        const data = doc.data();

        const updates = {};
        if (status) updates.status = status;
        if (price != null || price !== 0 || price !== 0.0
        )
            updates.price = price;
        if (adminMessage || adminMessage !== '') updates.adminMessage = adminMessage;

        if (data.isOther && (!updates.price || updates.price <= 0)) {
            return res.status(400).json({
                error: 'Other turdagi so‘rov uchun narxni (> 0) kiriting.'
            });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({error: 'Hech nima yangilanmadi.'});
        }

        await docRef.update(updates);
        return res.json({success: true});
    }

async function listAllRequests(req, res) {
    let query = admin.firestore().collection('RepairRequests');
    if (req.query.status) {
        query = query.where('status', '==', req.query.status);
    }
    const snap = await query.orderBy('createdAt', 'desc').get();
    const requests = snap.docs.map(d => d.data());
    return res.json(requests);
}

module.exports = {
    listUsers,
    deleteUser, updateRequest, listAllRequests
};
