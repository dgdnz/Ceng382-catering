"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Star, ShoppingBag, Navigation, ChevronRight, Store } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  avgRating: number;
  totalRatings: number;
}

interface Caterer {
  id: string;
  catererName: string;
  email: string;
  latitude: number;
  longitude: number;
  distance: number;
  avgCatererRating: number;
  totalCatererRatings: number;
  menuItems: MenuItem[];
}

export default function BrowseCaterersPage() {
  // Simulating user location (Default to Ankara center: 39.9207, 32.8541)
  const [userLat, setUserLat] = useState("39.9207");
  const [userLng, setUserLng] = useState("32.8541");
  const [detecting, setDetecting] = useState(false);

  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [selectedCaterer, setSelectedCaterer] = useState<Caterer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Fetch Nearby Caterers
  const fetchCaterers = async (lat: string, lng: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/user/caterers?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error("Failed to fetch nearby caterers.");
      const data = await response.json();
      setCaterers(data);
      if (data.length > 0) {
        setSelectedCaterer(data[0]); // Select closest by default
      } else {
        setSelectedCaterer(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaterers(userLat, userLng);
  }, []);

  // HTML5 Auto-Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        setUserLat(lat);
        setUserLng(lng);
        setDetecting(false);
        fetchCaterers(lat, lng);
      },
      (err) => {
        alert("Unable to retrieve your location. Using default coordinates.");
        setDetecting(false);
      }
    );
  };

  // Google Maps API Loader
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing in env. Displaying simulated visual map.");
      return;
    }

    if ((window as any).google) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    (window as any).initMap = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      delete (window as any).initMap;
    };
  }, []);

  // Map Instance and Markers Lifecycle
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !caterers.length || !(window as any).google) return;

    const google = (window as any).google;
    const center = { lat: parseFloat(userLat), lng: parseFloat(userLng) };

    // Clear old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Initialize Map if not already done
    if (!googleMapInstance.current) {
      googleMapInstance.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        styles: [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#ffb6c1" }, { lightness: 40 }], // Pink water for theme!
          },
        ],
      });
    } else {
      googleMapInstance.current.setCenter(center);
    }

    const map = googleMapInstance.current;

    // 1. User Marker (Blue Pin)
    const userMarker = new google.maps.Marker({
      position: center,
      map,
      title: "Your Location",
      icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });
    markersRef.current.push(userMarker);

    // 2. Caterers Markers (Pink Pins)
    caterers.forEach((cat) => {
      const marker = new google.maps.Marker({
        position: { lat: cat.latitude, lng: cat.longitude },
        map,
        title: cat.catererName,
        icon: "https://maps.google.com/mapfiles/ms/icons/pink-dot.png",
      });

      marker.addListener("click", () => {
        setSelectedCaterer(cat);
      });

      markersRef.current.push(marker);
    });
  }, [mapLoaded, caterers, userLat, userLng]);

  return (
    <div className="min-h-screen bg-background">
      
      {/* Top Navbar */}
      <nav className="bg-white border-b border-primary border-opacity-30 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-secondary hover:text-accent font-bold flex items-center gap-1">
            <ArrowLeft className="w-5 h-5" /> Home
          </Link>
          <span className="text-primary font-light">|</span>
          <h1 className="text-2xl font-extrabold text-textDark flex items-center gap-2">
            <span>🍩</span> Browse Nearby Bakeries
          </h1>
        </div>
      </nav>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(screen-80px)]">
        
        {/* Left Sidebar: Settings and Proximity List (col-span-4) */}
        <div className="lg:col-span-4 bg-white border-r border-primary border-opacity-30 p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
          
          {/* Coordinate settings / Simulating location */}
          <div className="bg-background bg-opacity-40 p-5 rounded-2xl border border-primary border-opacity-30">
            <h3 className="font-extrabold text-textDark text-sm mb-3 flex items-center gap-1">
              <Navigation className="w-4 h-4 text-accent" /> Configure Your Location
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-textLight mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-primary border-opacity-40 text-textDark bg-white focus:outline-none"
                  value={userLat}
                  onChange={(e) => setUserLat(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-textLight mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-primary border-opacity-40 text-textDark bg-white focus:outline-none"
                  value={userLng}
                  onChange={(e) => setUserLng(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDetectLocation}
                disabled={detecting}
                className="flex-1 flex justify-center items-center gap-1 bg-white border border-primary text-secondary hover:bg-primary hover:text-white text-xs font-bold py-2 rounded-xl transition duration-200"
              >
                📍 {detecting ? "Locating..." : "Auto Detect"}
              </button>
              <button
                onClick={() => fetchCaterers(userLat, userLng)}
                disabled={loading}
                className="flex-1 bg-secondary text-white hover:bg-accent text-xs font-bold py-2 rounded-xl transition duration-200 shadow-sm"
              >
                Search Nearby
              </button>
            </div>
          </div>

          {/* Bakery list */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-textDark text-lg border-b border-primary border-opacity-20 pb-2">
              Nearby Caterers (Within 30 km)
            </h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
              </div>
            ) : caterers.length > 0 ? (
              <div className="space-y-3">
                {caterers.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCaterer(cat)}
                    className={`w-full text-left p-4 rounded-2xl border transition duration-200 flex items-center justify-between ${
                      selectedCaterer?.id === cat.id
                        ? "bg-primary bg-opacity-20 border-accent border-opacity-60 shadow-md"
                        : "bg-white border-primary border-opacity-20 hover:border-primary"
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-textDark">{cat.catererName}</h4>
                      <p className="text-xs font-bold text-secondary mt-1">{cat.distance} km away</p>
                      
                      {/* Rating dynamically fetched */}
                      <div className="flex items-center gap-1 mt-2 text-xs font-bold text-yellow-600">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {cat.avgCatererRating > 0 ? `${cat.avgCatererRating} (${cat.totalCatererRatings} ratings)` : "No reviews"}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-secondary transition ${selectedCaterer?.id === cat.id ? "transform translate-x-1" : ""}`} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-textLight italic text-center py-6">
                No caterers found within 30 km radius.
              </p>
            )}
          </div>

        </div>

        {/* Right Section: Map & Menu Items (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-80px)]">
          
          {/* Map display */}
          <div className="h-72 w-full border-b border-primary border-opacity-30 bg-pink-50 relative">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Fallback Simulation Notice */}
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
              <div className="absolute inset-0 bg-primary bg-opacity-10 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm pointer-events-none">
                <MapPin className="w-12 h-12 text-secondary animate-bounce mb-2" />
                <h4 className="font-bold text-textDark">Google Map Simulation Active</h4>
                <p className="text-xs text-textLight max-w-sm mt-1">
                  Add <code className="bg-white px-1 py-0.5 rounded border">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your env file to load live Google Maps with custom markers.
                </p>
              </div>
            )}
          </div>

          {/* Menu Items of the Selected Caterer */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-background bg-opacity-35">
            {selectedCaterer ? (
              <div className="space-y-6">
                
                {/* Selected Caterer Details banner */}
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-primary border-opacity-30 shadow-sm">
                  <div>
                    <span className="text-xs uppercase font-extrabold text-accent tracking-wider">Currently Viewing Menu Of</span>
                    <h2 className="text-2xl font-extrabold text-textDark mt-1 flex items-center gap-1.5">
                      <Store className="w-6 h-6 text-secondary" /> {selectedCaterer.catererName}
                    </h2>
                    <p className="text-xs text-textLight mt-1">{selectedCaterer.distance} km from your coordinate</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-2xl border border-yellow-100 flex items-center gap-1 text-sm font-extrabold shadow-sm">
                      <Star className="w-4 h-4 fill-current" />
                      {selectedCaterer.avgCatererRating > 0 ? `${selectedCaterer.avgCatererRating} / 5.0` : "New Shop"}
                    </div>
                  </div>
                </div>

                {/* Pastry Items List */}
                <h3 className="font-extrabold text-textDark text-lg pt-4">🍰 Pastry Catalog</h3>
                
                {selectedCaterer.menuItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCaterer.menuItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-primary border-opacity-30 flex flex-col justify-between hover:shadow-md transition">
                        
                        <div className="p-4 flex gap-4">
                          {/* Pastry image */}
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-pink-50 flex-shrink-0">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          {/* Pastry text */}
                          <div>
                            <h4 className="font-bold text-textDark text-base">{item.name}</h4>
                            <p className="text-xs text-textLight line-clamp-2 mt-1">{item.description}</p>
                            
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-extrabold text-accent">${item.price.toFixed(2)}</span>
                              
                              {/* Dynamic Item rating */}
                              <div className="flex items-center gap-1 text-xs font-bold text-yellow-600">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {item.avgRating > 0 ? `${item.avgRating.toFixed(1)} (${item.totalRatings})` : "No ratings"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Add to order action button */}
                        <div className="px-4 pb-4 pt-2 border-t border-dashed border-primary border-opacity-20 flex justify-end">
                          <button className="flex items-center gap-1.5 bg-secondary hover:bg-accent text-white font-bold text-xs px-4 py-2 rounded-full transition shadow-sm">
                            <ShoppingBag className="w-3.5 h-3.5" /> Customize & Order
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-textLight italic text-center py-10 bg-white rounded-3xl border border-primary border-opacity-25">
                    This bakery has not uploaded any sweet pastries yet.
                  </p>
                )}

              </div>
            ) : (
              <div className="text-center py-20">
                <span className="text-6xl mb-4 inline-block">🗺️</span>
                <h4 className="font-bold text-textDark text-lg">Select a bakery on the map or sidebar</h4>
                <p className="text-textLight mt-1">Bakeries close to your coordinate will show their menu items here.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
