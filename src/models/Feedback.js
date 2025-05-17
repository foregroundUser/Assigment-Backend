class Feedback {
    constructor({ id, uid, requestId, rating, comment, createdAt = null }) {
        this.id        = id;
        this.uid       = uid;
        this.requestId = requestId;
        this.rating    = rating;
        this.comment   = comment;
        this.createdAt = createdAt;
    }
    toJSON() {
        return {
            id:        this.id,
            uid:       this.uid,
            requestId: this.requestId,
            rating:    this.rating,
            comment:   this.comment,
            createdAt: this.createdAt
        };
    }
}

module.exports = Feedback;
