const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'], required: true },
  timestamp: { type: Date, default: Date.now }
});

// Prevent duplicate attendance for the same meal on the same day
AttendanceSchema.index({ studentId: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);