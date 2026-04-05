const mongoose = require('mongoose');

const schemaOptions = {
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
};

const rentalSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  devices: [{
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    quantity: { type: Number, required: true, default: 1 },
    pricePerDay: { type: Number, required: true }
  }],
  status: { type: String, enum: ['renting', 'late', 'returned'], default: 'renting' },
  rentalDate: { type: Date, required: true },
  plannedReturnDate: { type: Date, required: true },
  actualReturnDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  totalPrice: { type: Number },
  deposit: { type: Number }
}, schemaOptions);

module.exports = mongoose.model('Rental', rentalSchema);
