"use client";
import { getsocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const JoinRoom = () => {
  const [roomid, setRoomid] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const HandleJoin = () => {
    const socket = getsocket();
    socket.emit("join-room", { roomid, password }, (res) => {
      if (res.success) {
        router.push(`/rooms/${roomid}`);
      } else {
        alert(res.message);
      }
    });
  };
  return (
    <div className="flex flex-col gap-6 justify-center">
      <div>
        <p className="text-2xl ">Join Room</p>
      </div>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={roomid}
          onChange={(e) => setRoomid(e.target.value)}
          placeholder="Room ID"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={HandleJoin}
        >
          Join
        </button>
      </div>
    </div>
  );
};

export default JoinRoom;
