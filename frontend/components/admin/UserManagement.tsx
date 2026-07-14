"use client";
import React, { useEffect, useState } from "react";
import { fetchAdminUsers, adminDeleteUser } from "@/lib/api";
import { User } from "@/types";
import Swal from "sweetalert2";
import { Trash2, Store, User as UserIcon } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "customer" | "seller">("all");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, name: string) => {
    const res = await Swal.fire({
      title: "Are you sure?",
      text: `Delete user ${name}? This will remove their account, store, and products. Their reviews will remain anonymous.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#ef4444",
    });

    if (res.isConfirmed) {
      try {
        await adminDeleteUser(userId);
        Swal.fire("Deleted!", "User has been deleted.", "success");
        loadUsers();
      } catch (err: any) {
        Swal.fire("Error", err?.response?.data?.detail || "Failed to delete user", "error");
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filter === "customer") return !u.has_store && u.role !== "admin";
    if (filter === "seller") return u.has_store;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-900 uppercase">Registered Users ({filteredUsers.length})</h2>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("customer")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === "customer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setFilter("seller")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === "seller" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Store Owners
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${u.role === 'admin' ? 'bg-red-500' : u.has_store ? 'bg-blue-600' : 'bg-slate-300'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {u.role === "admin" ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">Admin</span>
                      ) : u.has_store ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <Store size={10} /> Store Owner
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <UserIcon size={10} /> Customer
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
