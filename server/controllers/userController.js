import User from "../models/user.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcryptjs";

// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "Email already exists" });

        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });


        const token = generateToken(newUser._id);

        // remove password before sending response
        const userResponse = {
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            bio: newUser.bio,
            profilepic: newUser.profilepic,
        };

        res.json({ success: true, userData: userResponse, token, message: "Account created successfully" });
    } catch (error) {
        
       console.error("Signup error:", error);

    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: "Email already exists" });
    }

    return res.status(500).json({ success: false, message: error.message });
    }
};

// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(userData._id);

        const userResponse = {
            _id: userData._id,
            fullName: userData.fullName,
            email: userData.email,
            bio: userData.bio,
            profilepic: userData.profilepic,
        };

        res.status(400).json({ success: true, userData: userResponse, token, message: "Login successful" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
};

// Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilepic, bio, fullName } = req.body;
        const userId = req.user._id;
        let updatedUser;

        if (!profilepic) {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { bio, fullName },
                { new: true }
            );
        } else {
            const upload = await cloudinary.uploader.upload(profilepic);
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilepic: upload.secure_url, bio, fullName },
                { new: true }
            );
        }

        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
