import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { ChatMessage, Group, User } from "../types";
import type { ChatSocket } from "../lib/ws";

interface ChatRoomProps {
  user: User;
  group: Group;
  socket: ChatSocket;
  onBack: () => void;
}

export function ChatRoom({ user, group, socket, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [readBy, setReadBy] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api.listMessages(group.id).then((res) => setMessages(res.messages));
    socket.join(group.id);

    const unsubscribe = socket.on((msg) => {
      if (msg.type === "message" && msg.message.groupId === group.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.message.id)) return prev;
          return [...prev, msg.message];
        });
      }
      if (msg.type === "read_receipt" && msg.groupId === group.id) {
        setReadBy((prev) => ({ ...prev, [msg.userId]: msg.messageId }));
      }
    });

    return () => {
      unsubscribe();
      socket.leave(group.id);
    };
  }, [group.id, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const last = messages[messages.length - 1];
    if (last) {
      socket.markRead(group.id, last.id);
    }
  }, [messages, group.id, socket]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    socket.sendMessage(group.id, text);
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col rounded-2xl bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 戻る
        </button>
        <h2 className="font-semibold">{group.name}</h2>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => {
          const isMine = message.userId === user.id;
          return (
            <div
              key={message.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {!isMine && (
                  <p className="mb-1 text-xs font-medium opacity-70">
                    {message.displayName}
                  </p>
                )}
                <p>{message.content}</p>
                <p className="mt-1 text-xs opacity-60">
                  {new Date(message.createdAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {Object.keys(readBy).length > 0 && (
        <p className="px-4 text-xs text-slate-400">
          既読: {Object.keys(readBy).length} 人
        </p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          送信
        </button>
      </form>
    </div>
  );
}
