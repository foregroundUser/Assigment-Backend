class User {
    constructor({ uid, email, username, isAdmin = false, createdAt = null }) {
        this.uid       = uid;
        this.email     = email;
        this.username  = username;
        this.isAdmin   = isAdmin;
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            uid:       this.uid,
            email:     this.email,
            username:  this.username,
            isAdmin:   this.isAdmin,
            createdAt: this.createdAt
        };
    }
}

module.exports = User;
