import { useEffect, useMemo, useState } from "react";
import { AuthForm } from "./components/AuthForm";
import { ChatRoom } from "./components/ChatRoom";
import { GroupList } from "./components/GroupList";
import { api, clearToken, getToken } from "./lib/api";
import { ChatSocket } from "./lib/ws";
import type { Group, User } from "./types";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [booting, setBooting] = useState(true);

  const socket = useMemo(() => new ChatSocket(), []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setBooting(false);
      return;
    }

    void api
      .me()
      .then((res) => {
        setUser(res.user);
        socket.connect(token);
      })
      .catch(() => clearToken())
      .finally(() => setBooting(false));

    return () => socket.disconnect();
  }, [socket]);

  function handleAuthSuccess(nextUser: User) {
    const token = getToken();
    if (token) socket.connect(token);
    setUser(nextUser);
  }

  function handleLogout() {
    socket.disconnect();
    clearToken();
    setUser(null);
    setSelectedGroup(null);
  }

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Chat App</h1>
            <p className="text-sm text-slate-500">{user.displayName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        {selectedGroup ? (
          <ChatRoom
            user={user}
            group={selectedGroup}
            socket={socket}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <GroupList onSelect={setSelectedGroup} />
        )}
      </main>
    </div>
  );
}

export default App;
