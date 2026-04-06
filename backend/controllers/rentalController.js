const Rental = require('../models/rentalModel');
const Device = require('../models/deviceModel');

exports.getAll = async (req, res) => {
  try {
    const rentals = await Rental.find().populate('customerId').populate('devices.device');
    
    const now = new Date();
    // Return the rentals with dynamic status without blocking with database writes
    const processedRentals = rentals.map(r => {
      const rental = r.toObject();
      if (rental.status === 'renting' && rental.plannedReturnDate && new Date(rental.plannedReturnDate) < now) {
        rental.status = 'late';
      }
      return rental;
    });
    
    res.json(processedRentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
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
    
    // Update device available quantities and specific unit status
    if (req.body.devices && req.body.devices.length > 0) {
      for (let item of req.body.devices) {
        if (item.device) {
          const device = await Device.findById(item.device);
          if (device) {
             device.availableQuantity -= item.quantity;
             if (item.selectedSerials && item.selectedSerials.length > 0) {
               device.units.forEach(u => {
                 if (item.selectedSerials.includes(u.serialNumber)) {
                   u.status = 'renting';
                 }
               });
             }
             await device.save();
          }
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
    }

    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
