class RepairRequest {
    constructor({
                    id,
                    uid,
                    issueName,
                    problemType,
                    isOther = false,
                    description = null,
                    status = 'PENDING',
                    price = null,
                    images = [],
                    createdAt = null,
                    adminMessage = null
                }) {
        this.id           = id;
        this.uid          = uid;
        this.issueName    = issueName;
        this.problemType  = problemType;
        this.isOther      = isOther;
        this.description  = description;
        this.status       = status;
        this.price        = price;
        this.images       = images;
        this.createdAt    = createdAt;
        this.adminMessage = adminMessage;
    }

    toJSON() {
        return {
            id:           this.id,
            uid:          this.uid,
            issueName:    this.issueName,
            problemType:  this.problemType,
            isOther:      this.isOther,
            description:  this.description,
            status:       this.status,
            price:        this.price,
            images:       this.images,
            createdAt:    this.createdAt,
            adminMessage: this.adminMessage
        };
    }
}

module.exports = RepairRequest;
