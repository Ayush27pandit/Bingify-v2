import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose, { set } from "mongoose";
import http from "http";
import { Server } from "socket.io";
import { setupServer } from "./socket";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 5000;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  setupServer(io, socket);
});

server.listen(PORT, () => {
  console.log("✅ Server + Socket.io running on port", PORT);
});
