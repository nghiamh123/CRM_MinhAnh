const Customer = require('../models/customerModel');
const Rental = require('../models/rentalModel');
const Device = require('../models/deviceModel');
const { deleteFile } = require('./uploadController');



exports.getAll = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Find all rentals for this customer to restore devices
    const associatedRentals = await Rental.find({ customerId: req.params.id });
    
    for (const rental of associatedRentals) {
      if (rental.status !== 'returned') {
        // Restore device quantities and unit statuses
        for (const item of rental.devices) {
          if (item.device) {
            const device = await Device.findById(item.device);
            if (device) {
              device.availableQuantity += item.quantity;
              if (item.selectedSerials && item.selectedSerials.length > 0) {
                device.units.forEach(u => {
                  if (item.selectedSerials.includes(u.serialNumber)) {
                    u.status = 'available';
                  }
                });
              }
              await device.save();
            }
          }
        }
      }
      // Delete the rental record
      await Rental.findByIdAndDelete(rental._id);
    }

    // Delete images from R2
    if (customer.idCardFront) await deleteFile(customer.idCardFront);
    if (customer.idCardBack) await deleteFile(customer.idCardBack);
    if (customer.idCardSelfie) await deleteFile(customer.idCardSelfie);

    const deleted = await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully (including associated rentals)' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


