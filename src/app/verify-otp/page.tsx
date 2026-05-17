"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setSuccess("🔒 Secure Authentication Complete! Redirecting...");
      
      // Role-Based Redirection on OTP Success
      const role = data.role;
      setTimeout(() => {
        if (role === "ADMIN") {
          router.push("/admin");
        } else if (role === "CATERER") {
          router.push("/caterer");
        } else {
          router.push("/"); // Default user homepage
        }
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
          <span className="text-5xl animate-float inline-block">🔒</span>
          <h2 className="mt-4 text-3xl font-extrabold text-textDark">
            Enter 2FA Code
          </h2>
          <p className="mt-2 text-sm text-secondary font-medium">
            We sent a 6-digit verification OTP code to your email. Check your inbox (or console if running simulated)!
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
            
            {/* 6-digit input */}
            <div>
              <label className="block text-sm font-bold text-textDark text-center mb-2">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="appearance-none rounded-xl relative block w-full text-center px-4 py-4 border border-primary border-opacity-60 placeholder-textLight text-textDark text-2xl font-bold tracking-widest focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 bg-background bg-opacity-30"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
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
              {loading ? "Verifying..." : "Secure Verify & Enter 🔓"}
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link href="/login" className="text-secondary hover:text-textDark text-xs font-bold underline">
            Back to Step 1 (Login Screen)
          </Link>
        </div>

      </div>
    </div>
  );
}
