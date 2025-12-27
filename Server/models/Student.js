const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // The Roll Number
  name: { type: String, required: true },
  email: { type: String, required: true },
  
  // This stores the secret hash (e.g., "7a8b9c...") that is inside the QR image
  qrCode: { type: String, required: true, unique: true }, 
  
  status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' },
});

module.exports = mongoose.model('Student', StudentSchema);