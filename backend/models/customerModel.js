const mongoose = require('mongoose');

const schemaOptions = {
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
};


const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  identityCard: { type: String },
  idCardFront: { type: String },
  idCardBack: { type: String },
  idCardSelfie: { type: String },
  notes: { type: String },
  isRental: { type: Boolean, default: false }
}, schemaOptions);

module.exports = mongoose.model('Customer', customerSchema);
