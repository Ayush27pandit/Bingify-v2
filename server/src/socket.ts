import { Server, Socket } from "socket.io";
import { Room } from "./types";

//dummy array to store rooms, in future use DB

const rooms: Record<string, Room> = {};

export function setupServer(io: Server, socket: Socket) {
  console.log(`user connected: ${socket.id}`);

  //create room
  socket.on(
    "create-room",
    (
      {
        roomid,
        password,
        iframeUrl,
      }: { roomid: string; password: string; iframeUrl: string },
      callback
    ) => {
      if (rooms[roomid]) {
        return callback({ success: false, message: "Room already exists" });
      }

      rooms[roomid] = {
        password,
        users: [socket.id],
        admin: socket.id,

        iframeUrl,
      };
      socket.join(roomid);
      callback({ success: true, message: "Room created successfully" });

      //sending the data to user when join in room
      // socket.emit("user-joined", {
      //   roomid: roomid,
      //   users: rooms[roomid].users,
      //   admin: rooms[roomid].admin,
      //   iframeUrl: rooms[roomid].iframeUrl,
      // });
      //sending the data to all users in room when new user join
      io.to(roomid).emit("user-joined", {
        roomid: roomid,
        users: rooms[roomid].users,
        admin: rooms[roomid].admin,
        iframeUrl: rooms[roomid].iframeUrl,
      });
    }
  );

  //on join-room
  socket.on(
    "join-room",
    ({ roomid, password }: { roomid: string; password: string }, callback) => {
      const room = rooms[roomid];
      if (!room)
        return callback({ success: false, message: "Room does not exist" });
      if (room.password !== password)
        return callback({ success: false, message: "Incorrect password" });
      if (room.users.length > 2)
        return callback({ success: false, message: "Room is full" });
      //push user to room
      room.users.push(socket.id);
      socket.join(roomid);
      callback({ success: true, message: "Joined room successfully" });
      // socket.emit("user-joined", {
      //   users: room.users,
      //   admin: room.admin,
      //   iframeUrl: room.iframeUrl,
      //   roomid: roomid,
      // });
      io.to(roomid).emit("user-joined", {
        users: room.users,
        admin: room.admin,
        iframeUrl: room.iframeUrl,
        roomid: roomid,
      });
    }
  );

  socket.on("get-room-data", ({ roomid }) => {
    const room = rooms[roomid];
    if (!room) return;
    const socketId = socket.id;
    const isKnownUser = room.users.includes(socketId);
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
  });

  // //sending iframe to room users
  // socket.on(
  //   "send-iframe",
  //   (
  //     { roomid, iframeUrl }: { roomid: string; iframeUrl: string },
  //     callback
  //   ) => {
  //     if (!rooms[roomid]) {
  //       return callback?.({ success: false, message: "Room not found" });
  //     }

  //     if (rooms[roomid].admin !== socket.id) {
  //       return callback?.({ success: false, message: "You are not admin" });
  //     }
  //     io.to(roomid).emit("iframe-received", { iframeUrl });
  //     callback?.({ success: true, message: "Iframe sent" });
  //   }
  // );

  //disconnect user
  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
    for (const roomid in rooms) {
      const room = rooms[roomid];

      room.users = room.users.filter((user) => user !== socket.id);
      if (room.users.length === 0) {
        delete rooms[roomid];
      } else {
        //exited user(socket.id) is same as  room admin then change the admin to next joined user
        if (room.admin === socket.id) {
          room.admin = room.users[0];
          io.to(roomid).emit("user-left", {
            roomId: roomid,
            users: room.users,
            admin: room.admin,
          });
        }
      }
    }
  });
}
