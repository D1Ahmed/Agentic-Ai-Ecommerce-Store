"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { UserPlus, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function SignUpPage() {
  const { register, googleLogin, isAuthenticated } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="font-black text-3xl tracking-tighter uppercase italic mb-2">
            HD<span className="text-blue-600">wear</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">
            Create Account
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Join HDwear to save your cart and checkout securely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 outline-none"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating account...
              </>
            ) : (
              <>
                <UserPlus size={16} /> Create Account
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
                  try {
                    await googleLogin(credentialResponse.credential);
                    router.push("/");
                  } catch (err: any) {
                    setError(err?.response?.data?.detail || "Google Login failed");
                  }
                }
              }}
              onError={() => {
                setError("Google Login failed");
              }}
            />
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-blue-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
