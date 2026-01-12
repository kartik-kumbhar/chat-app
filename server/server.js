import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://chat-app-frontend-pink-nu.vercel.app"
  ],
  credentials: true
}));

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/auth", userRouter);
app.use("/messages", messageRouter);

app.get("/", (req, res) => res.send("Server is Live"));

export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-app-frontend-pink-nu.vercel.app"
    ],
    credentials: true
  }
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query?.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log("Server running on PORT", PORT)
);
