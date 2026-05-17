"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      setSuccess("Step 1 Complete! A 6-digit code has been sent to your email.");
      setTimeout(() => {
        router.push("/verify-otp");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-primary border-opacity-40">
        
        {/* Header */}
        <div className="text-center">
          <span className="text-5xl animate-float inline-block">🎂</span>
          <h2 className="mt-4 text-3xl font-extrabold text-textDark">
            Welcome Back!
          </h2>
          <p className="mt-2 text-sm text-secondary font-medium">
            Please log in to explore sweet catering offers.
          </p>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-textDark mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-primary border-opacity-60 placeholder-textLight text-textDark focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm bg-background bg-opacity-30"
                placeholder="you@sweetshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-textDark mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-primary border-opacity-60 placeholder-textLight text-textDark focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm bg-background bg-opacity-30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-secondary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? "Verifying Sweet Credentials..." : "Log In 🍭"}
            </button>
          </div>
        </form>

        {/* Redirect */}
        <div className="text-center pt-2">
          <p className="text-xs text-textDark font-medium">
            Don't have an account yet?{" "}
            <Link href="/register" className="text-accent font-bold hover:underline">
              Sign up here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
