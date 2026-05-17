"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [catererName, setCatererName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          catererName: role === "CATERER" ? catererName : undefined,
          latitude: role === "CATERER" ? latitude : undefined,
          longitude: role === "CATERER" ? longitude : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSuccess(data.message || "Registration successful!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
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
          <span className="text-5xl animate-float inline-block">🧁</span>
          <h2 className="mt-4 text-3xl font-extrabold text-textDark">
            Sweet Treats Club
          </h2>
          <p className="mt-2 text-sm text-secondary font-medium">
            Register to order delicious pastries or manage your catering shop!
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

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-bold text-textDark mb-1">
                I want to join as a:
              </label>
              <select
                className="block w-full px-4 py-3 border border-primary border-opacity-60 text-textDark bg-background bg-opacity-30 rounded-xl focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER">Customer (User)</option>
                <option value="CATERER">Pastry Caterer</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            {/* Dynamic Caterer-Only Fields */}
            {role === "CATERER" && (
              <div className="space-y-4 pt-4 border-t border-dashed border-primary border-opacity-60" data-aos="fade-down">
                <h4 className="text-sm font-extrabold text-accent">Caterer Shop Settings</h4>
                
                <div>
                  <label className="block text-xs font-bold text-textDark mb-1">
                    Catering Shop Name
                  </label>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-2 border border-primary border-opacity-60 text-textDark focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm bg-background bg-opacity-30"
                    placeholder="Grandma's Patisserie"
                    value={catererName}
                    onChange={(e) => setCatererName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-textDark mb-1">
                      Latitude (Maps API)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="appearance-none rounded-xl relative block w-full px-4 py-2 border border-primary border-opacity-60 text-textDark focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm bg-background bg-opacity-30"
                      placeholder="39.9207"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textDark mb-1">
                      Longitude (Maps API)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="appearance-none rounded-xl relative block w-full px-4 py-2 border border-primary border-opacity-60 text-textDark focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm bg-background bg-opacity-30"
                      placeholder="32.8541"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-secondary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? "Registering..." : "Create Account 🍰"}
            </button>
          </div>
        </form>

        {/* Redirect */}
        <div className="text-center pt-2">
          <p className="text-xs text-textDark font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
