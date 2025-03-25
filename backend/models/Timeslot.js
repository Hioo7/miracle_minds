const mongoose = require('mongoose');

const TimeslotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
  slots: [
    {
      from: { type: String, required: true },
      to: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model('Timeslot', TimeslotSchema);
