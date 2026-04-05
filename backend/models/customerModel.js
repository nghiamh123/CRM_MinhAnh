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

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  identityCard: { type: String },
  notes: { type: String }
}, schemaOptions);

module.exports = mongoose.model('Customer', customerSchema);
