class User {
    constructor({ uid, email, username, isAdmin = false, createdAt = null, profileImage = null }) {
        this.uid          = uid;
        this.email        = email;
        this.username     = username;
        this.isAdmin      = isAdmin;
        this.createdAt    = createdAt;
        this.profileImage = profileImage || 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png';
    }

    toJSON() {
        const obj = {};
        if (this.uid !== undefined) obj.uid = this.uid;
        if (this.email !== undefined) obj.email = this.email;
        if (this.username !== undefined) obj.username = this.username;
        if (this.isAdmin !== undefined) obj.isAdmin = this.isAdmin;
        if (this.createdAt !== undefined) obj.createdAt = this.createdAt;
        if (this.profileImage !== undefined) obj.profileImage = this.profileImage;
        return obj;
    }
}

module.exports = User;
