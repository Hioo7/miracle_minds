// Dependencies
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
app.use(express.json());

// Configure CORS for frontend (localhost:3000)
app.use(
  cors({
    origin:"http://localhost:3000" && "https://miracle-minds-frontend.vercel.app", // Allow frontend requests || 
    credentials: true, // Allow cookies and authentication headers
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const timeslotRoutes = require("./routes/timeslotRoutes");
const therapyRoutes = require("./routes/therapyRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const therapistRoutes = require("./routes/therapistRoutes");
const cartRoutes = require("./routes/cart.js"); // Import cart routes
const paymentRoutes = require("./routes/paymentRoutes.js");
const refundRoutes = require("./routes/refundRoutes");
const emailVerificationRoutes = require("./routes/emailVerification");
// const reportRoutes = require("./routes/reportRoutes.js");
// Use routes
app.use("/api/auth", authRoutes);

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", timeslotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/therapies", therapyRoutes);
app.use("/api", therapistRoutes);
app.use("/api/cart", cartRoutes); // Use cart routes
app.use("/api/payments", paymentRoutes);
app.use("/api/bookings", refundRoutes);
const adminBookingRoutes = require("./routes/adminBookingRoutes");
app.use("/api/bookings", adminBookingRoutes);

app.use("/api/auth", emailVerificationRoutes);
const expertProfileRoutes = require("./routes/expertProfileRoutes.js"); // Import expert profile routes
app.use("/api", expertProfileRoutes); 
const expertAvailabilityRoutes = require("./routes/expertAvailabilityRoutes");
app.use("/api", expertAvailabilityRoutes);
const expertBookingRoutes = require('./routes/expertBookingRoutes');
app.use('/api', expertBookingRoutes);
const subAdminRoutes = require('./routes/subAdminRoutes');
app.use('/api', subAdminRoutes);

// app.use("/api/reports" ,reportRoutes)

// Start server (original)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// -------------------------------
// ADDITIONAL CODE FOR VIRTUAL MEETING (Socket.io)
// -------------------------------

/**
 * 1) We launch a second server on a DIFFERENT port 
 *    to handle real-time meeting logic via Socket.io.
 */
const MEETING_PORT = process.env.MEETING_PORT || 6000;

const http = require("http");
const { Server } = require("socket.io");

// Create a new HTTP server using the same Express app
// (but on a different port to avoid conflicts)
const meetingServer = http.createServer(app);

// Initialize Socket.io on the meetingServer
const io = new Server(meetingServer, {
  cors: {
    origin: "https://miracle-minds-frontend.vercel.app", // Allow frontend to connect
    credentials: true,
  },
});

// Listen for Socket.io connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // 1) On join-meeting, join a room identified by bookingId
  socket.on("join-meeting", (bookingId) => {
    console.log(`Socket ${socket.id} joined meeting room ${bookingId}`);
    socket.join(bookingId);
    // Broadcast that a new user joined
    socket.broadcast.to(bookingId).emit("user-joined", {
      userId: socket.id,
      meetingId: bookingId,
    });
  });

  // 2) Example: simple chat-message event
  socket.on("chat-message", (data) => {
    // data might be: { meetingId, userId, message }
    console.log(`Message in ${data.meetingId} from ${data.userId}: ${data.message}`);
    io.to(data.meetingId).emit("chat-message", data);
  });

  // 3) On disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Listen on the MEETING_PORT for the meeting server
meetingServer.listen(MEETING_PORT, () => {
  console.log(`Meeting server running on port ${MEETING_PORT}`);
});
