/**
 * Authentication Routes
 * Handles user registration, login, admin access
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { verifyToken, generateToken } = require("../middleware/auth");

const router = express.Router();

/* =========================
   VALIDATIONS
========================= */

const registerValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Min 6 chars password")
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required")
];

/* =========================
   USER REGISTER
========================= */

router.post("/register", registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, firebaseUid } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const user = new User({
      name,
      email,
      passwordHash: password,
      role: "user",
      firebaseUid: firebaseUid || null,
      isActive: true
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: user.toPublicJSON(), token }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

/* =========================
   USER LOGIN
========================= */

router.post("/login", loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      data: { user: user.toPublicJSON(), token }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

/* =========================
   FIREBASE LOGIN
========================= */

router.post("/firebase", async (req, res) => {
  try {
    const { firebaseUid, email, name, avatar } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ success: false, message: "Firebase UID required" });
    }

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        user.firebaseUid = firebaseUid;
      } else {
        user = new User({
          name: name || email.split("@")[0],
          email,
          firebaseUid,
          avatar,
          role: "user",
          isActive: true
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Firebase login successful",
      data: { user: user.toPublicJSON(), token }
    });
  } catch (err) {
    console.error("Firebase auth error:", err);
    res.status(500).json({ success: false, message: "Firebase login failed" });
  }
});

/* =========================
   ADMIN LOGIN
========================= */

router.post("/admin/login", loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email }).select("+passwordHash");
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    if (!["admin", "authority"].includes(admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const match = await admin.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const token = generateToken(admin._id);
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      success: true,
      message: "Admin login successful",
      data: { user: admin.toPublicJSON(), token }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Admin login failed" });
  }
});

/* =========================
   CREATE ADMIN (BOOTSTRAP SAFE)
========================= */

router.post("/admin/create", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists && currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create new admins"
      });
    }

    const { name, email, password, role = "admin", department } = req.body;

    if (!["admin", "authority"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const admin = new User({
      name,
      email,
      passwordHash: password,
      role,
      department: role === "authority" ? department : null,
      isActive: true
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin account created",
      data: admin.toPublicJSON()
    });
  } catch (err) {
    console.error("Admin create error:", err);
    res.status(500).json({ success: false, message: "Admin creation failed" });
  }
});

module.exports = router;