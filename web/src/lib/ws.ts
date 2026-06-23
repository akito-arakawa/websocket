import type { ServerWsMessage } from "../types";

type MessageHandler = (message: ServerWsMessage) => void;

const WS_BASE = import.meta.env.VITE_WS_URL;

export class ChatSocket {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();

  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const base =
      WS_BASE ??
      `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.hostname}:3000`;
    const url = `${base}/ws?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as ServerWsMessage;
        for (const handler of this.handlers) {
          handler(message);
        }
      } catch {
        // ignore malformed messages
      }
    };
  }

  on(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  join(groupId: string): void {
    this.send({ type: "join", groupId });
  }

  leave(groupId: string): void {
    this.send({ type: "leave", groupId });
  }

  sendMessage(groupId: string, content: string): void {
    this.send({ type: "send_message", groupId, content });
  }

  markRead(groupId: string, messageId: string): void {
    this.send({ type: "mark_read", groupId, messageId });
  }
}
