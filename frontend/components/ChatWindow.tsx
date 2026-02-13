"use client";
import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { Send, X, Bot, User, Sparkles } from "lucide-react";
import axios from "axios";

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const { handleAIAction } = useStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I'm The Clerk. Looking for something specific, or want to negotiate a price?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      // Connect to your Python FastAPI backend
      const response = await axios.post(
        `http://localhost:8000/chat?user_message=${encodeURIComponent(userMsg)}`,
      );
      const { text, action } = response.data;

      setMessages((prev) => [...prev, { role: "ai", text: text }]);

      // TRIGGER THE UI MAGIC (Sort, Haggle, etc.)
      if (action !== "NONE") {
        handleAIAction(action);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Sorry, I'm having trouble connecting to the warehouse.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-bold">The AI Clerk</span>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-blue-700 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white border text-gray-800 rounded-tl-none shadow-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-xs text-gray-400 italic">
            The Clerk is checking inventory...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Search, sort, or haggle..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
