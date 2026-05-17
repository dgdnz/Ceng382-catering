"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit, UtensilsCrossed, ArrowLeft } from "lucide-react";

interface Option {
  id?: string;
  name: string;
  priceChange: number;
}

interface Group {
  id?: string;
  name: string;
  isRequired: boolean;
  allowMultiple: boolean;
  options: Option[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  customizationGroups: Group[];
}

export default function CatererMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMenu = async () => {
    try {
      const response = await fetch("/api/caterer/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items.");
      const data = await response.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sweet creation? 🍰")) return;

    try {
      const response = await fetch(`/api/caterer/menu/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete menu item.");

      setItems(items.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/caterer/dashboard" className="inline-flex items-center gap-2 text-secondary hover:text-accent font-bold mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold text-textDark flex items-center gap-3">
            <UtensilsCrossed className="w-10 h-10 text-accent" />
            Menu Management
          </h1>
          <p className="text-secondary mt-2 font-medium">
            Add, update, or remove delicious items from your shop.
          </p>
        </div>
        <div>
          <Link
            href="/caterer/menu/new"
            className="flex items-center gap-2 bg-secondary text-white font-bold px-6 py-3 rounded-full shadow-md hover:bg-accent transition duration-300"
          >
            <Plus className="w-5 h-5" /> Add New Pastry 🧁
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl mb-6">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-primary border-opacity-30 hover:shadow-xl transition duration-300 flex flex-col">
              {/* Image */}
              <div className="h-56 relative w-full bg-pink-50 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 bg-white text-accent font-extrabold px-4 py-1 rounded-full shadow-md">
                  ${item.price.toFixed(2)}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-textDark mb-2">{item.name}</h3>
                  <p className="text-textLight text-sm mb-4 line-clamp-3">{item.description}</p>
                  
                  {/* Customizations count */}
                  {item.customizationGroups.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Customizations</p>
                      <div className="flex flex-wrap gap-2">
                        {item.customizationGroups.map((g) => (
                          <span key={g.id} className="bg-background text-secondary text-xs px-3 py-1 rounded-full font-semibold border border-primary border-opacity-30">
                            {g.name} ({g.options.length})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-dashed border-primary border-opacity-30 mt-auto">
                  <Link
                    href={`/caterer/menu/edit/${item.id}`}
                    className="flex-1 flex justify-center items-center gap-2 bg-background border border-primary text-secondary hover:bg-primary hover:text-white font-bold py-2 rounded-xl transition duration-200"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex justify-center items-center gap-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold py-2 rounded-xl transition duration-200"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-primary border-opacity-30">
          <span className="text-6xl mb-4 inline-block">🧁</span>
          <h3 className="text-xl font-bold text-textDark">No pastries created yet</h3>
          <p className="text-secondary font-medium mt-2">Start adding items to build your sweet menu catalog!</p>
          <Link
            href="/caterer/menu/new"
            className="mt-6 inline-block bg-secondary text-white font-bold px-8 py-3 rounded-full shadow-md hover:bg-accent transition duration-300"
          >
            Add First Pastry
          </Link>
        </div>
      )}
    </div>
  );
}
