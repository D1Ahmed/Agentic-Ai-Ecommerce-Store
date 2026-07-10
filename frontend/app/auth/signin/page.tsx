"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { LogIn, Loader2, CheckCircle } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function SignInPage() {
  const { login, googleLogin, isAuthenticated } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errorMessage = typeof detail === 'string' 
        ? detail 
        : Array.isArray(detail) && detail.length > 0 && typeof detail[0].msg === 'string'
          ? detail[0].msg
          : "Sign in failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-20">
      {/* Full-page loading overlay for Google sign-in */}
      {googleLoading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl animate-pulse">
            <CheckCircle size={28} className="text-white" />
          </div>
          <div className="text-center">
            <p className="font-black text-xl uppercase tracking-widest text-slate-900">
              Signing you in...
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Setting up your account
            </p>
          </div>
          <Loader2 size={24} className="animate-spin text-blue-600 mt-2" />
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="text-slate-900 font-black text-3xl tracking-tighter uppercase italic mb-2">
            HD<span className="text-blue-600">wear</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">
            Sign In
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Welcome back. Sign in to save your bag and checkout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Email
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none text-slate-900"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none text-slate-900"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setError("");
                  setGoogleLoading(true);
                  try {
                    await googleLogin(credentialResponse.credential);
                    router.push("/");
                  } catch (err: any) {
                    setGoogleLoading(false);
                    setError(err?.response?.data?.detail || "Google Login failed. Please try again.");
                  }
                }
              }}
              onError={() => {
                setGoogleLoading(false);
                setError("Google Login failed. Please try again.");
              }}
            />
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          New here?{" "}
          <Link href="/auth/signup" className="text-blue-600 font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
