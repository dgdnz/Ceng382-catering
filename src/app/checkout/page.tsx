"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { ArrowLeft, CreditCard, ShoppingBag, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();

  // Card Form State
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Redirect if cart is empty (unless showing success)
  useEffect(() => {
    if (cart.length === 0 && !success) {
      router.push("/menus");
    }
  }, [cart, success]);

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 16);
    // Format 1111 2222 3333 4444
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    // Format MM/YY
    const formatted = value.replace(/(\d{2})(?=\d)/g, "$1/");
    setCardExpiry(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCardCvv(value);
  };

  // Submit Order & Simulate Payment
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (cart.length === 0) {
      setError("Your cart is empty!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catererId: cart[0].catererId,
          items: cart,
          totalPrice: cartTotal,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process order.");

      setOrderId(data.orderId);
      setSuccess(true);
      clearCart(); // Wipes local storage/context cart safely
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-md w-full border border-primary border-opacity-30 shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-textDark">Payment Successful!</h1>
          <p className="text-secondary font-medium">
            Your simulated payment of <span className="font-extrabold text-accent">${cartTotal.toFixed(2)}</span> has been confirmed.
          </p>
          <div className="bg-background bg-opacity-40 p-4 rounded-xl border border-primary border-opacity-35 text-xs text-textLight">
            <p className="font-bold text-textDark">Simulated Order Details</p>
            <p className="mt-1">Order ID: <span className="font-mono">{orderId}</span></p>
            <p className="mt-0.5">Status: <span className="text-green-600 font-bold">PREPARING 🧁</span></p>
          </div>
          <p className="text-xs text-textLight italic">
            The baker has received your order and is currently whipping up your sweet creations!
          </p>
          <Link
            href="/user/dashboard"
            className="block w-full bg-secondary hover:bg-accent text-white font-extrabold py-3.5 rounded-full transition duration-300 shadow-md"
          >
            Go to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto mb-6">
        <Link href="/menus" className="inline-flex items-center gap-2 text-secondary hover:text-accent font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Pastries Catalog
        </Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Dynamic Order Summary (col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-primary border-opacity-30 shadow-xl space-y-6">
          <h2 className="text-2xl font-extrabold text-textDark flex items-center gap-2 pb-3 border-b border-primary border-opacity-20">
            <ShoppingBag className="w-6 h-6 text-accent" /> Order Summary
          </h2>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {cart.map((item) => {
              const customizationSum = item.selectedOptions.reduce(
                (sum, opt) => sum + opt.priceChange,
                0
              );
              const singleTotal = item.basePrice + customizationSum;

              return (
                <div key={item.id} className="flex gap-4 p-4 bg-background bg-opacity-20 rounded-2xl border border-primary border-opacity-20">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-textDark text-sm">{item.name}</h4>
                      <span className="font-extrabold text-textDark text-sm">${(singleTotal * item.quantity).toFixed(2)}</span>
                    </div>
                    
                    {/* Render chosen customizations in summary */}
                    {item.selectedOptions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedOptions.map((opt, idx) => (
                          <span key={idx} className="bg-white border border-primary border-opacity-30 text-textLight text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            {opt.optionName} {opt.priceChange > 0 ? `(+$${opt.priceChange.toFixed(2)})` : opt.priceChange < 0 ? `(-$${Math.abs(opt.priceChange).toFixed(2)})` : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-textLight font-semibold">
                      Qty: {item.quantity} • Unit Price: ${singleTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-background bg-opacity-30 p-5 rounded-2xl border border-primary border-opacity-35 space-y-3">
            <div className="flex justify-between text-sm text-textLight font-bold">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-textLight font-bold">
              <span>Simulated Shipping / Delivery</span>
              <span className="text-green-600 font-extrabold">FREE</span>
            </div>
            <div className="flex justify-between text-lg text-textDark font-extrabold border-t border-primary border-opacity-20 pt-3">
              <span>Grand Total</span>
              <span className="text-accent">${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Card Payment Simulation (col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-10 border border-primary border-opacity-30 shadow-xl space-y-6">
          <h2 className="text-2xl font-extrabold text-textDark flex items-center gap-2 pb-3 border-b border-primary border-opacity-20">
            <CreditCard className="w-6 h-6 text-accent" /> Payment Details
          </h2>

          <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-xs text-secondary font-medium flex gap-2">
            <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
            <p>
              <strong>Sandbox Mode Active:</strong> Real cards are prohibited. Please enter dummy credentials to simulate checkout completion.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-textDark mb-1">Cardholder Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-primary border-opacity-60 text-textDark bg-background bg-opacity-15 focus:outline-none focus:ring-secondary focus:border-secondary text-sm"
                placeholder="Jane Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-textDark mb-1">Card Number</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-primary border-opacity-60 text-textDark bg-background bg-opacity-15 focus:outline-none focus:ring-secondary focus:border-secondary text-sm"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={handleCardNumberChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-textDark mb-1">Expiry Date</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-primary border-opacity-60 text-textDark bg-background bg-opacity-15 focus:outline-none focus:ring-secondary focus:border-secondary text-sm"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textDark mb-1">CVV</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-primary border-opacity-60 text-textDark bg-background bg-opacity-15 focus:outline-none focus:ring-secondary focus:border-secondary text-sm"
                  placeholder="•••"
                  value={cardCvv}
                  onChange={handleCvvChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex justify-center items-center gap-2 bg-secondary hover:bg-accent text-white font-extrabold py-4 rounded-full transition duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Authorizing Payment..." : `Pay Now $${cartTotal.toFixed(2)}`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
