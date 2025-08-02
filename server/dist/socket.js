"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupServer = setupServer;
const prisma_client_1 = __importDefault(require("./utils/prisma_client"));
//dummy array to store rooms, in future use DB
function setupServer(io, socket) {
    console.log(`user connected: ${socket.id}`);
    //create room
    socket.on("create-room", (_a, callback_1) => __awaiter(this, [_a, callback_1], void 0, function* ({ roomid, password, iframeUrl, }, callback) {
        try {
            const existingRoom = yield prisma_client_1.default.room.findUnique({
                where: { roomid },
            });
            if (existingRoom) {
                return callback({ success: false, message: "Room already exists" });
            }
            const newroom = yield prisma_client_1.default.room.create({
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
        }
        catch (error) {
            console.error(error);
            callback({ success: false, message: "Error creating room" });
        }
    }));
    //on join-room
    socket.on("join-room", (_a, callback_1) => __awaiter(this, [_a, callback_1], void 0, function* ({ roomid, password }, callback) {
        try {
            const room = yield prisma_client_1.default.room.findUnique({
                where: { roomid },
                include: { users: true },
            });
            if (!room)
                return callback({ success: false, message: "Room does not exist" });
            if (room.password !== password)
                return callback({ success: false, message: "Incorrect password" });
            if (room.users.length > 2)
                return callback({ success: false, message: "Room is full" });
            yield prisma_client_1.default.user.create({
                data: {
                    socketId: socket.id,
                    room: { connect: { id: room.id } },
                },
            });
            socket.join(roomid);
            const updatedRoom = yield prisma_client_1.default.room.findUnique({
                where: { roomid },
                include: { users: true },
            });
            callback({ success: true, message: "Joined room successfully" });
            io.to(roomid).emit("user-joined", {
                users: updatedRoom === null || updatedRoom === void 0 ? void 0 : updatedRoom.users,
                admin: updatedRoom === null || updatedRoom === void 0 ? void 0 : updatedRoom.admin,
                iframeUrl: updatedRoom === null || updatedRoom === void 0 ? void 0 : updatedRoom.iframeUrl,
                roomid: roomid,
            });
        }
        catch (error) {
            console.error(error);
            callback({ success: false, message: "Error joining room" });
        }
    }));
    socket.on("get-room-data", (_a) => __awaiter(this, [_a], void 0, function* ({ roomid }) {
        try {
            const room = yield prisma_client_1.default.room.findUnique({
                where: { roomid },
                include: { users: true },
            });
            if (!room)
                return;
            const socketId = socket.id;
            const isKnownUser = room.users.some((user) => user.socketId === socket.id);
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
        }
        catch (error) {
            console.error(error);
        }
    }));
    //disconnect user
    socket.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
        console.log(`user disconnected: ${socket.id}`);
        try {
            const user = yield prisma_client_1.default.user.findUnique({
                where: { socketId: socket.id },
                include: { room: { include: { users: true } } },
            });
            if (!user || !user.room)
                return;
            const room = user.room;
            const updatedUsers = room.users.filter((u) => u.socketId !== socket.id);
            //remove user from db
            yield prisma_client_1.default.user.delete({ where: { socketId: socket.id } });
            if (updatedUsers.length === 0) {
                yield prisma_client_1.default.room.delete({ where: { roomid: room.roomid } });
            }
            else {
                const newAdmin = room.admin === socket.id ? updatedUsers[0].socketId : room.admin;
                yield prisma_client_1.default.room.update({
                    where: { roomid: room.roomid },
                    data: { admin: newAdmin },
                });
                io.to(room.roomid).emit("user-left", {
                    users: updatedUsers,
                    admin: newAdmin,
                    roomid: room.roomid,
                });
            }
        }
        catch (error) {
            console.error("Disconnect cleanup error:", error);
        }
    }));
}
