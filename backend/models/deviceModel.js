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


const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String },
  status: { type: String, enum: ['available', 'renting', 'maintenance', 'late'], default: 'available' },
  totalQuantity: { type: Number, default: 1 },
  availableQuantity: { type: Number, default: 1 },
  pricePerDay: { type: Number },
  description: { type: String },
  units: [{
    serialNumber: { type: String, required: true },
    status: { type: String, enum: ['available', 'renting', 'maintenance'], default: 'available' }
  }]
}, schemaOptions);

module.exports = mongoose.model('Device', deviceSchema);
