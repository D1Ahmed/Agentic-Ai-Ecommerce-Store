"use client";
import React, { useEffect, useState } from "react";
import { fetchAdminAnalytics } from "@/lib/api";
import { Users, UserPlus, Activity, BarChart3 } from "lucide-react";

export default function AnalyticsStats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-slate-500 font-bold uppercase">Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Total Visits</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{data.total_visitors}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Today</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{data.today_visitors}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart3 size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Last 7 Days</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{data.week_visitors}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserPlus size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-purple-600">
            <div className="p-2 bg-purple-50 rounded-lg">
              <UserPlus size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Last 30 Days</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{data.month_visitors}</p>
        </div>

      </div>
    </div>
  );
}
