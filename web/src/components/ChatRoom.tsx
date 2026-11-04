import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { ChatMessage, Group, User } from "../types";

interface ChatRoomProps {
  user: User;
  group: Group;
  onBack: () => void;
}

export function ChatRoom({ user, group, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api.listMessages(group.id).then((res) => setMessages(res.messages));
  }, [group.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Issue #10 で WebSocket 経由の送信を実装
    void input;
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

      <div className="mx-4 mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
        WebSocket 未実装のため、リアルタイム送受信・既読は利用できません（Issue #9, #10 参照）
      </div>

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

      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力...（WebSocket 実装後に有効）"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
          disabled
        />
        <button
          type="submit"
          disabled
          className="rounded-lg bg-blue-600 px-4 py-2 text-white opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
