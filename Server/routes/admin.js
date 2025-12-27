const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

// ✅ Correct Imports based on your confirmation
const Student = require('../models/Student');
const Attendance = require('../models/Attendance'); 

const upload = multer({ dest: 'uploads/' });

// --- EMAIL SETUP ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper: Send Email
const sendQREmail = async (studentName, email, qrDataUrl, isRejoining = false) => {
  const subject = isRejoining ? 'Welcome Back! Your Mess QR Code' : 'Welcome! Your Mess QR Code';
  const htmlMessage = isRejoining 
    ? `<p>Welcome back, ${studentName}. We have reactivated your <b>original</b> QR code.</p>` 
    : `<p>Welcome, ${studentName}. Here is your unique QR code for Mess Entry.</p>`;

  const mailOptions = {
    from: '"Mess Admin" <noreply@mess.com>',
    to: email,
    subject: subject,
    html: `<h2>${subject}</h2>${htmlMessage}<img src="cid:unique-qr-image" alt="QR Code" width="200"/>`,
    attachments: [{ filename: 'qrcode.png', path: qrDataUrl, cid: 'unique-qr-image' }]
  };

  try {
      await transporter.sendMail(mailOptions);
  } catch (err) {
      console.log("Email error (ignored):", err.message);
  }
};

// --- UPLOAD ROUTE ---
router.post('/upload-students', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const csvStudents = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => csvStudents.push(data))
    .on('end', async () => {
      try {
        const csvRollNos = csvStudents.map(s => s.rollNo);
        
        // Block missing students
        const blockResult = await Student.updateMany(
          { studentId: { $nin: csvRollNos }, status: 'Active' },
          { $set: { status: 'Blocked' } }
        );

        let stats = { new: 0, rejoined: 0, updated: 0, blocked: blockResult.modifiedCount };

        for (const row of csvStudents) {
          const { rollNo, name, email } = row;
          const existingStudent = await Student.findOne({ studentId: rollNo });

          if (!existingStudent) {
            // New Student
            const secretHash = crypto.randomBytes(16).toString('hex');
            const qrImage = await QRCode.toDataURL(secretHash);
            await Student.create({ studentId: rollNo, name, email, qrCode: secretHash });
            await sendQREmail(name, email, qrImage, false);
            stats.new++;
          } else {
            // Existing Student
            existingStudent.name = name;
            existingStudent.email = email;
            if (existingStudent.status === 'Blocked') {
              existingStudent.status = 'Active';
              await existingStudent.save();
              const qrImage = await QRCode.toDataURL(existingStudent.qrCode);
              await sendQREmail(name, email, qrImage, true);
              stats.rejoined++;
            } else {
              await existingStudent.save();
              stats.updated++;
            }
          }
        }
        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: `Sync Complete: New=${stats.new}, Updated=${stats.updated}` });

      } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: 'Server Error during upload' });
      }
    });
});

// --- REPORT ROUTE (FIXED) ---
// --- SAFE MODE REPORT ROUTE ---
router.get('/report', async (req, res) => {
  console.log("Generating Report for:", req.query); 

  try {
    const { startDate, endDate } = req.query;

    // 1. Simple Date Filter
    let query = {};
    if (startDate && endDate) {
      query.date = { 
        $gte: startDate, 
        $lte: endDate 
      };
    }

    // 2. Fetch Attendance Records (No complex aggregation)
    // .lean() makes it return plain JSON objects (faster)
    const attendanceRecords = await Attendance.find(query).sort({ timestamp: -1 }).lean();

    console.log(`Found ${attendanceRecords.length} attendance entries. Fetching student names...`);

    // 3. Manually attach Student Names (The "Safe" Join)
    // We use Promise.all to fetch student details for every attendance record
    const reportData = await Promise.all(attendanceRecords.map(async (record) => {
      
      // Find the student details for this record
      const student = await Student.findOne({ studentId: record.studentId }).lean();

      // Format the Time safely using standard JavaScript
      // This works on ALL computers/servers, regardless of MongoDB version
      const timeString = record.timestamp 
        ? new Date(record.timestamp).toLocaleTimeString('en-US', { hour12: false }) 
        : 'N/A';

      return {
        Date: record.date,
        Time: timeString,
        Roll_No: record.studentId,
        Name: student ? student.name : "Unknown Student", // Handles deleted/missing students safely
        Meal_Type: record.mealType
      };
    }));

    console.log("Report ready to send.");
    res.json(reportData);

  } catch (err) {
    console.error("❌ REPORT CRASH:", err);
    // Send the specific error text to the frontend so you can read it
    res.status(500).json({ message: "Report Failed", error: err.message });
  }
});

module.exports = router;