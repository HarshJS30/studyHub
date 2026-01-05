const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");

const User = require("../models/User");
const Otp = require("../models/Otp");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

/* ================= SEND OTP ================= */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email });

    // Save new OTP to database
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'StudyHub <onboarding@resend.dev>',
      to: email,
      subject: 'StudyHub - Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">Welcome to StudyHub!</h2>
            <p style="color: #666; font-size: 16px;">Your verification code is:</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    console.log('OTP sent successfully:', data);
    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

/* ================= VERIFY OTP & REGISTER ================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find OTP record
    const record = await Otp.findOne({ email, otp });
    
    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name: name || email.split('@')[0],
      email,
      password: hashedPassword
    });

    // Delete OTP after successful registration
    await Otp.deleteMany({ email });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;