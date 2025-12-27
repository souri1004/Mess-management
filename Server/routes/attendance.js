const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// FIXED: Renamed route to '/mark' to match one standard, but let's support the frontend input
router.post('/mark', async (req, res) => {
  // FIXED: Accept mealType from the frontend request
  const { qrCode, mealType } = req.body; 
  const today = new Date().toISOString().split('T')[0];

  // Logic: If frontend didn't send a mealType, reject it. 
  // (We trust the Dashboard to tell us what meal is currently being served)
  if (!mealType) {
    return res.status(400).json({ success: false, message: 'Meal Type is required' });
  }

  try {
    // 1. VALIDATE STUDENT
    const student = await Student.findOne({ qrCode });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Invalid QR Code' });
    }

    if (student.status === 'Blocked') {
      return res.status(403).json({ success: false, message: 'Student Blocked/Inactive' });
    }

    // 2. CHECK DUPLICATES
    const existingEntry = await Attendance.findOne({
      studentId: student.studentId,
      date: today,
      mealType: mealType
    });

    if (existingEntry) {
      return res.status(400).json({ success: false, message: `Already had ${mealType}!` });
    }

    // 3. MARK ATTENDANCE
    await Attendance.create({
      studentId: student.studentId,
      date: today,
      mealType: mealType
    });

    // Success Response
    res.status(200).json({ 
      success: true, 
      message: 'Access Granted', 
      student: { name: student.name, id: student.studentId }, // Added ID for display
      mealType: mealType 
    });

  } catch (err) {
    console.error("Attendance Error:", err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;