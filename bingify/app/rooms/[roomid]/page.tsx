"use client";
import { getsocket } from "@/lib/socket";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getEmbeddedYoutubeUrl } from "@/lib/embeddedUrl";

function Roompage() {
  const { roomid } = useParams() as { roomid: string };

  const [iframeUrl, setIframeUrl] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [admin, setAdmin] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    const socket = getsocket();
    console.log(`socket mounted `);

    socket.emit("get-room-data", { roomid });

    socket.on("room-data", (data) => {
      setUsers(data.users);
      setAdmin(data.admin);
      setIframeUrl(data.iframeUrl);
      const url = getEmbeddedYoutubeUrl(data?.iframeUrl);
      console.log("url: ", url);
      setEmbedUrl(url);
    });

    socket.on("user-joined", (data) => {
      setUsers(data.users);
    });

    socket.on("user-left", (data) => {
      console.log("user left ");
      setUsers(data.users);
      setAdmin(data.admin);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-data");
    };
  }, [roomid]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🎬 Room ID: {roomid}</h1>

      <p className="mt-2 text-lg">👑 Admin: {admin}</p>
      <p className="mt-2 text-lg">👥 Users: {users.join(", ")}</p>
      <p className="mt-2 text-lg">🎞️ Shared Video URL: {embedUrl}</p>

      {iframeUrl && (
        <div className="mt-6">
          <iframe
            src={embedUrl ?? undefined}
            width="640"
            height="360"
            allow="autoplay"
            className="border rounded"
          />
        </div>
      )}
    </div>
  );
}

export default Roompage;
