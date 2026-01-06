import User from "../models/user.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes
export const protectRoutes = async (req, res, next) => {
    try {
        const token = req.headers.token;

//
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.UserId).select("-password");

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }



        req.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

