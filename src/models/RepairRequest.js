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
                    location = null,       // ✅ YANGI QO‘SHILDI
                    createdAt = null
                }) {
        this.id          = id;
        this.uid         = uid;
        this.issueName   = issueName;
        this.problemType = problemType;
        this.isOther     = isOther;
        this.description = description;
        this.status      = status;
        this.price       = price;
        this.images      = images;
        this.location    = location;   // ✅ QO‘SHILDI
        this.createdAt   = createdAt;
    }

    toJSON() {
        return {
            id:          this.id,
            uid:         this.uid,
            issueName:   this.issueName,
            problemType: this.problemType,
            isOther:     this.isOther,
            description: this.description,
            status:      this.status,
            price:       this.price,
            images:      this.images,
            location:    this.location,   // ✅ QO‘SHILDI
            createdAt:   this.createdAt
        };
    }
}

module.exports = RepairRequest;
