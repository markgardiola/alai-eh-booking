import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Waves,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { API_URL } from "../../config";

// Shown once on open, purely client-side -- never sent to the backend as
// part of conversation history (see the `seed` filter in sendMessage).
const GREETING = {
  role: "assistant",
  content:
    "Hi, I'm SandyAI — the virtual front desk for ALAI-eh. Ask me about resorts, room availability, pricing, or the status of your booking.",
  actions: [],
  seed: true,
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // History sent to the backend excludes the client-only greeting and
    // the message we're about to send (that goes in `message` instead).
    const history = messages
      .filter((m) => !m.seed)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_URL}/api/chatbot/message`,
        { message: text, history },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, actions: data.actions || [] },
      ]);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "SandyAI is having trouble responding right now. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: message, actions: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
              <Waves className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-display text-base font-medium text-primary-foreground">
                SandyAI
              </p>
              <p className="text-xs text-primary-foreground/80">
                ALAI-eh front desk
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col",
                  m.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.content}
                </div>
                {m.actions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.actions.map((a, j) =>
                      a.external && /^https:\/\//.test(a.url) ? (
                        <Button key={j} size="sm" variant="outline" asChild>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="size-3.5" />
                            {a.label}
                          </a>
                        </Button>
                      ) : (
                        <Link key={j} to={a.url} onClick={() => setOpen(false)}>
                          <Button size="sm" variant="outline">
                            {a.label}
                          </Button>
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                SandyAI is typing...
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a resort, dates, your booking..."
              disabled={loading}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-lagoon-dark"
        aria-label={open ? "Close SandyAI chat" : "Chat with SandyAI"}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
