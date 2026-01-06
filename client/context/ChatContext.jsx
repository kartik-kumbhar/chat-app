import { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // ---------------- GET USERS ----------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  // ---------------- GET MESSAGES ----------------
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/messages/${userId}`);
      if (data.success) {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      setMessages([]);
      toast.error("Failed to load messages");
    }
  };

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/messages/send/${selectedUser?._id}`,
        messageData
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message || "Message failed");
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  // ---------------- SUBSCRIBE SOCKET ----------------
  const subscribeToMessages = () => {
    if (!socket) return;

    socket.off("newMessage"); // Prevent duplicate listeners

    socket.on("newMessage", (newMessage) => {
      // If currently chatting with sender
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);

        // Mark as seen in backend
        axios.put(`/messages/mark/${newMessage._id}`);
      } else {
        // Increase unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]:
            prev[newMessage.senderId] ? prev[newMessage.senderId] + 1 : 1,
        }));
      }
    });
  };

  // ---------------- UNSUBSCRIBE ----------------
  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    unseenMessages,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    setUnseenMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
