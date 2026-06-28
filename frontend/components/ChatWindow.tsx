"use client";
import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { Send, X, Bot, Sparkles, ShoppingCart, Eye, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendChatMessage, type ChatHistoryMessage } from "@/lib/api";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function ChatWindow() {
  const { handleAIAction, user } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const greeting = user
      ? `Welcome back, **${user.name}**! I'm **The Clerk**\n\n`
      : "Welcome to HDwear! I'm **The Clerk**\n\n";
    setMessages([
      {
        role: "ai",
        text:
          greeting +
          "I can help you:\n" +
          "- **Find clothes** — *Show me winter jackets for men*\n" +
          "- **Add to cart** — *Add the Midnight Urban Tee to my cart*\n" +
          "- **Buy instantly** — *I want to buy the Arctic Puffer, take me to checkout*\n" +
          "- **Negotiate prices** — *I'm a student, can I get a deal?*\n\n" +
          "What are you looking for today?",
      },
    ]);
  }, [user?.id, user?.name]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  /** Build Groq-compatible history from our message list (exclude the welcome message). */
  const buildHistory = (): ChatHistoryMessage[] => {
    return messages
      .slice(1) // skip the greeting
      .map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const history = buildHistory();
      const { text, action } = await sendChatMessage(userMsg, history, user?.name);

      setMessages((prev) => [...prev, { role: "ai", text }]);

      if (action && action !== "NONE") {
        // Small delay so the user sees the text response before the page changes
        setTimeout(() => handleAIAction(action), 400);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Sorry, my connection to the archive is temporarily down. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Quick action chips ──────────────────────────────────────────────────────
  const quickActions = [
    { label: "Summer clothes", msg: "Show me summer clothes" },
    { label: "Winter jackets", msg: "Show me winter jackets for men" },
    { label: "Women's shoes", msg: "Show me women's shoes" },
    { label: "Under Rs 3000", msg: "Show me clothes under Rs 3000" },
  ];

  return (
    <>
      {/* ── Floating bubble ─────────────────────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-slate-900 text-white p-5 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.35)] hover:bg-blue-600 hover:scale-110 transition-all z-[9999] group flex items-center gap-3 border border-white/10"
        >
          <Sparkles
            size={24}
            className="group-hover:rotate-12 transition-transform duration-500"
          />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-700 font-black uppercase tracking-[0.3em] text-[10px] whitespace-nowrap">
            Talk to Clerk
          </span>
        </button>
      )}

      {/* ── Chat window ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[440px] h-[640px] bg-white rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col z-[9999] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-full shadow-lg">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <span className="font-black uppercase tracking-widest text-xs block leading-none">
                  The Clerk
                </span>
                <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                  RAG-Powered AI Concierge
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick-action chips (only visible when chat is fresh) */}
          {messages.length <= 1 && (
            <div className="px-4 pt-3 pb-0 flex-shrink-0 flex flex-wrap gap-2">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => {
                    setInput(qa.msg);
                  }}
                  className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 no-scrollbar"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-sm">
                    <Bot size={14} className="text-slate-600" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-4 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm font-medium"
                      : "bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {m.role === "user" ? (
                    m.text
                  ) : (
                    <div className="flex flex-col">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({ ...props }) => (
                            <img
                              {...props}
                              className="w-full h-44 object-cover rounded-xl my-2 border border-slate-100 shadow-sm"
                            />
                          ),
                          h3: ({ ...props }) => (
                            <h3
                              {...props}
                              className="font-black text-sm uppercase tracking-tighter mt-3 mb-1 text-slate-900"
                            />
                          ),
                          a: ({ ...props }) => (
                            <a
                              {...props}
                              className="inline-block mt-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-colors no-underline"
                              target="_blank"
                            />
                          ),
                          p: ({ ...props }) => (
                            <p
                              {...props}
                              className="text-xs mb-2 leading-relaxed font-medium text-slate-600"
                            />
                          ),
                          strong: ({ ...props }) => (
                            <strong {...props} className="font-black text-slate-900" />
                          ),
                          em: ({ ...props }) => (
                            <em
                              {...props}
                              className="text-[11px] text-blue-600 font-bold not-italic block my-1.5 bg-blue-50 p-2 rounded-lg border border-blue-100"
                            />
                          ),
                          ul: ({ ...props }) => (
                            <ul {...props} className="list-none space-y-1 my-2" />
                          ),
                          li: ({ ...props }) => (
                            <li
                              {...props}
                              className="text-xs text-slate-600 flex items-start gap-1 before:content-['•'] before:text-blue-600 before:font-black"
                            />
                          ),
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                      {m.text.includes("still loading the product catalogue") && (
                        <div className="flex items-center gap-2 mt-3 text-blue-600 font-bold text-[10px] uppercase tracking-widest bg-blue-50 p-2 rounded-lg border border-blue-100 w-fit">
                          <Loader2 size={14} className="animate-spin" />
                          <span>Initializing Systems...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                  <Bot size={14} className="text-slate-600 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
            <div className="relative flex items-center gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for outfits, add to cart, checkout..."
                rows={1}
                className="flex-1 pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs text-slate-900 font-medium outline-none transition-all placeholder:text-slate-400 resize-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:hover:bg-slate-900 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
