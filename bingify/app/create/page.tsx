"use client";

import { getsocket } from "@/lib/socket";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateRoom() {
  const [roomid, setroomid] = useState("");
  const [password, setPassword] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const router = useRouter();

  const handleCreate = () => {
    const socket = getsocket();
    socket.emit("create-room", { roomid, password, iframeUrl }, (res) => {
      if (res.success) {
        router.push(`/rooms/${roomid}`);
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto justify-center mt-12">
      <h1 className="text-2xl font-bold">Create Room</h1>
      <input
        type="text"
        placeholder="Room ID"
        value={roomid}
        onChange={(e) => setroomid(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="url"
        placeholder="Movie Url"
        value={iframeUrl}
        onChange={(e) => setIframeUrl(e.target.value)}
      />

      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
