import { Server, Socket } from "socket.io";
import { Room } from "./types";
import prisma from "./utils/prisma_client";

//dummy array to store rooms, in future use DB

export function setupServer(io: Server, socket: Socket) {
  console.log(`user connected: ${socket.id}`);

  //create room
  socket.on(
    "create-room",
    async (
      {
        roomid,
        password,
        iframeUrl,
      }: { roomid: string; password: string; iframeUrl: string },
      callback
    ) => {
      try {
        const existingRoom = await prisma.room.findUnique({
          where: { roomid },
        });
        if (existingRoom) {
          return callback({ success: false, message: "Room already exists" });
        }

        const newroom = await prisma.room.create({
          data: {
            roomid,
            password,
            iframeUrl,
            admin: socket.id,
            users: {
              create: {
                socketId: socket.id,
              },
            },
          },
          include: {
            users: true,
          },
        });

        socket.join(roomid);
        callback({ success: true, message: "Room created successfully" });

        io.to(roomid).emit("user-joined", {
          roomid: roomid,
          users: newroom.users,
          admin: newroom.admin,
          iframeUrl: newroom.iframeUrl,
        });
      } catch (error) {
        console.error(error);
        callback({ success: false, message: "Error creating room" });
      }
    }
  );

  //on join-room
  socket.on(
    "join-room",
    async (
      { roomid, password }: { roomid: string; password: string },
      callback
    ) => {
      try {
        const room = await prisma.room.findUnique({
          where: { roomid },
          include: { users: true },
        });
        if (!room)
          return callback({ success: false, message: "Room does not exist" });
        if (room.password !== password)
          return callback({ success: false, message: "Incorrect password" });
        if (room.users.length > 2)
          return callback({ success: false, message: "Room is full" });

        await prisma.user.create({
          data: {
            socketId: socket.id,
            room: { connect: { id: room.id } },
          },
        });

        socket.join(roomid);

        const updatedRoom = await prisma.room.findUnique({
          where: { roomid },
          include: { users: true },
        });
        callback({ success: true, message: "Joined room successfully" });

        io.to(roomid).emit("user-joined", {
          users: updatedRoom?.users,
          admin: updatedRoom?.admin,
          iframeUrl: updatedRoom?.iframeUrl,
          roomid: roomid,
        });
      } catch (error) {
        console.error(error);
        callback({ success: false, message: "Error joining room" });
      }
    }
  );

  socket.on("get-room-data", async ({ roomid }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { roomid },
        include: { users: true },
      });
      if (!room) return;
      const socketId = socket.id;
      const isKnownUser = room.users.some(
        (user: { socketId: string }) => user.socketId === socket.id
      );
      if (!isKnownUser) {
        socket.emit("error", { message: "You are not a member of this room" });
        return;
      }

      socket.emit("room-data", {
        users: room.users,
        admin: room.admin,
        iframeUrl: room.iframeUrl,
        roomid,
      });
    } catch (error) {
      console.error(error);
    }
  });

  //disconnect user
  socket.on("disconnect", async () => {
    console.log(`user disconnected: ${socket.id}`);
    try {
      const user = await prisma.user.findUnique({
        where: { socketId: socket.id },
        include: { room: { include: { users: true } } },
      });

      if (!user || !user.room) return;

      const room = user.room;
      const updatedUsers = room.users.filter(
        (u: { socketId: string }) => u.socketId !== socket.id
      );

      //remove user from db
      await prisma.user.delete({ where: { socketId: socket.id } });

      if (updatedUsers.length === 0) {
        await prisma.room.delete({ where: { roomid: room.roomid } });
      } else {
        const newAdmin =
          room.admin === socket.id ? updatedUsers[0].socketId : room.admin;
        await prisma.room.update({
          where: { roomid: room.roomid },
          data: { admin: newAdmin },
        });

        io.to(room.roomid).emit("user-left", {
          users: updatedUsers,
          admin: newAdmin,
          roomid: room.roomid,
        });
      }
    } catch (error) {
      console.error("Disconnect cleanup error:", error);
    }
  });
}
