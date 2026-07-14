"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import AnalyticsStats from "@/components/admin/AnalyticsStats";
import UserManagement from "@/components/admin/UserManagement";
import Navbar from "@/components/Navbar";
import { LayoutDashboard, Users } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthLoading } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"analytics" | "users">("analytics");

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user.role !== "admin") {
        router.push("/");
      }
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4 md:px-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Admin Dashboard</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage platform analytics and users.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-3 font-bold uppercase tracking-wider text-sm transition-colors ${
              activeTab === "analytics"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard size={18} /> Analytics
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-3 font-bold uppercase tracking-wider text-sm transition-colors ${
              activeTab === "users"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users size={18} /> Users
          </button>
        </div>

        {/* Content */}
        {activeTab === "analytics" && <AnalyticsStats />}
        {activeTab === "users" && <UserManagement />}
      </div>
    </div>
  );
}
