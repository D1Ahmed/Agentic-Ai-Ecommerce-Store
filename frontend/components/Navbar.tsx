"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { ShoppingBag, Search, X, User, LogOut, LogIn, UserPlus, Menu, Store } from "lucide-react";

export default function Navbar({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const { cart, user, isAuthenticated, isAuthLoading, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[120] h-20 px-6 md:px-10 flex items-center justify-between transition-all duration-500 ${
        transparent
          ? "bg-transparent"
          : "bg-white/80 backdrop-blur-xl border-b border-slate-200"
      }`}
    >
      <div className="flex items-center gap-4 lg:gap-12">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`lg:hidden p-2 rounded-lg transition-colors ${
            transparent ? "text-white hover:bg-white/20" : "text-slate-900 hover:bg-slate-100"
          }`}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link
          href="/"
          className={`font-black text-2xl tracking-tighter uppercase italic ${
            transparent ? "text-white drop-shadow-md" : "text-slate-900"
          }`}
        >
          HD<span className="text-blue-600">wear</span>
        </Link>

        <div
          className={`hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] ${
            transparent ? "text-white/60" : "text-slate-400"
          }`}
        >
          <Link
            href="/new-arrivals"
            className={`hover:text-blue-600 transition-all ${
              isActive("/new-arrivals")
                ? transparent
                  ? "text-white"
                  : "text-slate-900 border-b-2 border-slate-900 pb-1"
                : ""
            }`}
          >
            New Arrivals
          </Link>
          <Link
            href="/#collections"
            className={`hover:text-blue-600 transition-all ${
              isActive("/collections")
                ? transparent
                  ? "text-white"
                  : "text-slate-900 border-b-2 border-slate-900 pb-1"
                : ""
            }`}
          >
            Collections
          </Link>
          <Link
            href="/shoes"
            className={`hover:text-blue-600 transition-all ${
              isActive("/shoes")
                ? transparent
                  ? "text-white"
                  : "text-slate-900 border-b-2 border-slate-900 pb-1"
                : ""
            }`}
          >
            Shoes
          </Link>
          <Link
            href="/sale"
            className={`hover:text-red-600 transition-all ${
              isActive("/sale") ? "text-red-600" : ""
            }`}
          >
            Sale
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isSearchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shirts, jackets, shoes..."
              autoFocus
              className="w-48 md:w-72 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className={`${transparent ? "text-white/60" : "text-slate-400"} hover:text-slate-900 transition-colors`}
            >
              <X size={18} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`${transparent ? "text-white/60" : "text-slate-400"} hover:text-slate-900 transition-colors p-2`}
          >
            <Search size={20} />
          </button>
        )}

        <Link href="/cart">
          <button
            className={`relative p-3 rounded-full transition-all duration-500 shadow-lg ${
              transparent
                ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black"
                : "bg-slate-900 text-white hover:bg-blue-600"
            }`}
          >
            <ShoppingBag size={20} />
            {mounted && cart.length > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 bg-blue-600 text-white border-white">
                {cart.length}
              </span>
            )}
          </button>
        </Link>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => !isAuthLoading && setIsProfileOpen((open) => !open)}
            className={`p-3 rounded-full transition-all duration-500 shadow-lg ${
              transparent
                ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black"
                : isAuthLoading
                  ? "bg-slate-200 text-slate-400 cursor-wait animate-pulse"
                  : isAuthenticated
                    ? "bg-blue-600 text-white hover:bg-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={isAuthLoading ? "Loading..." : isAuthenticated ? user?.name : "Account"}
            disabled={isAuthLoading}
          >
            <User size={20} />
          </button>

          {isProfileOpen && !isAuthLoading && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-[200]">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  {user?.has_store ? (
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-b border-slate-100"
                    >
                      <Store size={16} /> Seller Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/seller/register"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-b border-slate-100"
                    >
                      <Store size={16} /> Become a Seller
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LogIn size={16} /> Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-100"
                  >
                    <UserPlus size={16} /> Create Account
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Premium Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 w-full h-[calc(100dvh-5rem)] bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 lg:hidden flex flex-col z-[110] animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col p-6 gap-2">
            <Link
              href="/new-arrivals"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-6 py-5 text-xl font-black uppercase tracking-[0.2em] text-white border-b border-white/10 hover:text-blue-500 hover:bg-white/5 transition-all rounded-xl"
            >
              New Arrivals
            </Link>
            <Link
              href="/#collections"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-6 py-5 text-xl font-black uppercase tracking-[0.2em] text-white border-b border-white/10 hover:text-blue-500 hover:bg-white/5 transition-all rounded-xl"
            >
              Collections
            </Link>
            <Link
              href="/shoes"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-6 py-5 text-xl font-black uppercase tracking-[0.2em] text-white border-b border-white/10 hover:text-blue-500 hover:bg-white/5 transition-all rounded-xl"
            >
              Shoes
            </Link>
            <Link
              href="/sale"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-6 py-5 text-xl font-black uppercase tracking-[0.2em] text-red-500 hover:text-red-400 hover:bg-white/5 transition-all rounded-xl"
            >
              Sale
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
