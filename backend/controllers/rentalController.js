const Rental = require('../models/rentalModel');
const Device = require('../models/deviceModel');

exports.getAll = async (req, res) => {
  try {
    // We populate customerId and devices.device to get full details instead of just IDs
    const rentals = await Rental.find().populate('customerId').populate('devices.device');
    
    // Check for late status
    const now = new Date();
    let changed = false;
    for (const r of rentals) {
      if (r.status === 'renting' && r.plannedReturnDate && new Date(r.plannedReturnDate) < now) {
        r.status = 'late';
        await r.save();
        changed = true;
      }
    }
    
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const newRental = new Rental({
      ...req.body,
      status: 'renting'
    });
    
    await newRental.save();
    
    // Update device available quantities
    if (req.body.devices && req.body.devices.length > 0) {
      for (let item of req.body.devices) {
        if (item.device) {
          // decrement available quantity
          await Device.findByIdAndUpdate(item.device, { 
            $inc: { availableQuantity: -item.quantity }
          });
        }
      }
    }
    
    res.status(201).json(newRental);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const oldRental = await Rental.findById(req.params.id);
    if (!oldRental) return res.status(404).json({ error: 'Rental not found' });

    let updateData = { ...req.body };

    // Logic: If transitioning to 'returned', restore device quantities
    if (updateData.status === 'returned' && oldRental.status !== 'returned') {
      if (oldRental.devices && oldRental.devices.length > 0) {
        for (let item of oldRental.devices) {
          if (item.device) {
            // increment available quantity
            await Device.findByIdAndUpdate(item.device, { 
              $inc: { availableQuantity: item.quantity }
            });
          }
        }
      }
      updateData.actualReturnDate = new Date();
      updateData.status = 'returned';
    }

    const updated = await Rental.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const rentalToRemove = await Rental.findById(req.params.id);
    if (!rentalToRemove) return res.status(404).json({ error: 'Rental not found' });

    if (rentalToRemove.status !== 'returned') {
       // If deleting an ongoing rental, free up the devices
       if (rentalToRemove.devices && rentalToRemove.devices.length > 0) {
         for (let item of rentalToRemove.devices) {
           if (item.device) {
             await Device.findByIdAndUpdate(item.device, { 
               $inc: { availableQuantity: item.quantity }
             });
           }
         }
       }
    }

    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
