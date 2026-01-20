import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext(); 

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  "https://chat-app-4wn7.onrender.com";

// Set Axios base URL globally
axios.defaults.baseURL = backendUrl;
console.log("Backend URL →", backendUrl);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ---------------- CHECK AUTH ----------------
  const checkAuth = async () => {
    if (!token) return;

    try {
      const { data } = await axios.get("/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.log(error);
      toast.error("Authentication failed");
    }
  };

  // ---------------- SOCKET CONNECT ----------------
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      withCredentials: true,
      transports: ["websocket"]
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  // ---------------- LOGIN / SIGNUP ----------------
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/auth/${state}`, credentials);

      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);

        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Login / Signup failed");
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);

    delete axios.defaults.headers.common["token"];

    if (socket) socket.disconnect();

    toast.success("Logged out successfully");
  };

  // ---------------- UPDATE PROFILE ----------------
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Profile update failed");
    }
  };

  // ---------------- INIT ----------------
  useEffect(() => {
    if (token) axios.defaults.headers.common["token"] = token;
    checkAuth();
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
