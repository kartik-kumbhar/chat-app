import User from "../models/user.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcryptjs";

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res
        .status(400)
        .json({ success: false, message: "Missing details" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    const userResponse = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      bio: newUser.bio,
      profilepic: newUser.profilepic || "",
    };

    res
      .status(201)
      .json({
        success: true,
        userData: userResponse,
        token,
        message: "Account created successfully",
      });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });

    const userData = await User.findOne({ email });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      userData.password
    );
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);

    const userResponse = {
      _id: userData._id,
      fullName: userData.fullName,
      email: userData.email,
      bio: userData.bio,
      profilepic: userData.profilepic || "",
    };

    res.status(200).json({
      success: true,
      userData: userResponse,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ---------------- CHECK AUTH ----------------
export const checkAuth = (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = async (req, res) => {
  try {
    const { profilepic, bio, fullName } = req.body;
    const userId = req.user._id;

    let updateData = { bio, fullName };

    if (profilepic) {
      const upload = await cloudinary.uploader.upload(profilepic, {
        folder: "chat-app",
      });

      updateData.profilepic = upload.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Profile update failed" });
  }
};
