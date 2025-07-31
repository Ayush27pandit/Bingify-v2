import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
  //event types the server emits to client

  "user-joined": (data: {
    users: string[];
    admin: string;
    roomid: string;
    iframeUrl: string;
  }) => void;
  "user-left": (data: {
    users: string[];
    admin: string;
    roomid: string;
  }) => void;

  "room-data": (data: {
    users: string[];
    admin: string;
    roomid: string;
    iframeUrl: string;
  }) => void;
}

interface ClientToServerEvents {
  // event types the client emits to server
  "create-room": (
    data: { roomid: string; password: string; iframeUrl: string },
    callback: (response: { success: boolean; message: string }) => void
  ) => void;
  "join-room": (
    data: { roomid: string; password: string },
    callback: (response: { success: boolean; message: string }) => void
  ) => void;
  "leave-room": (
    data: { roomid: string },
    callback: (response: { success: boolean; message: string }) => void
  ) => void;

  "get-room-data": (data: { roomid: string }) => void;

  // "send-iframe": (
  //   data: { roomid: string; iframeUrl: string },
  //   callback?: (response: { success: boolean; message: string }) => void
  // ) => void;
}
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getsocket = (): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> => {
  if (!socket) {
    socket = io("http://localhost:5000");
  }
  return socket;
};
