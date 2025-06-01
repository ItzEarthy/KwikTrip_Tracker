import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
const API_BASE = import.meta.env.VITE_API_URL || "/api";



export default function NicknameSetup({ onReady }) {
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const savedId = localStorage.getItem("userId");
    const savedName = localStorage.getItem("nickname");
    if (savedId && savedName) {
      onReady({ id: savedId, nickname: savedName });
    }
  }, []);

  const handleSubmit = () => {
    const id = uuidv4();
    localStorage.setItem("userId", id);
    localStorage.setItem("nickname", nickname);

    fetch(`${API_BASE}/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nickname }),
    }).then(() => {
      onReady({ id, nickname });
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center" style={{ background: 'var(--brand-bg)' }}>
      <div className="card w-80 flex flex-col items-center">
        <h1 className="mb-4" style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--brand-primary)' }}>
          Enter Your Nickname
        </h1>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mb-4 w-full"
          placeholder="Nickname"
        />
        <button
          onClick={handleSubmit}
          className="btn w-full"
        >
          Start
        </button>
      </div>
    </div>
  );
}
