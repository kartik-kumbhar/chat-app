import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const protectRoutes = async (req, res, next) => {
  try {
    // Support both custom header and Bearer token
    let token = req.headers.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // IMPORTANT FIX: correct field name
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Auth Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expired. Login again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token" });
    }

    res
      .status(500)
      .json({ success: false, message: "Authentication failed" });
  }
};
