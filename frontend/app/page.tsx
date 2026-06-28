"use client";
import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { ShoppingBag, Sparkles, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { cart } = useStore();

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Transparent Navigation */}
      <Navbar transparent />

      {/* Full-Screen Cinematic Hero */}
      <section className="relative h-screen flex items-end justify-end bg-black overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="relative z-10 p-12 pb-48 animate-in fade-in zoom-in duration-1000">
          <Link href="/collections">
            <button className="group flex items-center gap-4 bg-transparent backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white hover:text-black hover:border-white transition-all duration-500 shadow-2xl">
              Explore Collections
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </Link>
        </div>

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
      </section>
    </main>
  );
}
