import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MapTracking from "../components/MapTracking";
import ChatWindow from "../components/ChatWindow";
import { 
  Wrench, MapPin, Navigation, Clipboard, Phone, MessageSquare, 
  Loader, XCircle, CheckCircle2, DollarSign, Radio, Award 
} from "lucide-react";

const MechanicDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Location States
  const [coords, setCoords] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);

  // Orders
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(() => {
    const saved = localStorage.getItem("mechaGo_active_order");
    return saved ? JSON.parse(saved) : null;
  });

  // Price Negotiations
  const [priceInput, setPriceInput] = useState("");
  const [priceSaved, setPriceSaved] = useState(false);

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [socketNotification, setSocketNotification] = useState("");

  // Sync active order with localStorage
  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem("mechaGo_active_order", JSON.stringify(activeOrder));
      if (activeOrder.fixedPrice) {
        setPriceInput(activeOrder.fixedPrice.toString());
        setPriceSaved(true);
      } else {
        setPriceInput("");
        setPriceSaved(false);
      }
    } else {
      localStorage.removeItem("mechaGo_active_order");
    }
  }, [activeOrder]);

  // Periodic coordinates watch
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by browser");
      return;
    }

    const updateLocationInBackend = async (lat, lon) => {
      try {
        // Try updating first (PATCH /api/mechanic/location)
        await axios.patch("/mechanic/location", {
          longitude: lon,
          latitude: lat
        });
        setTrackingActive(true);
      } catch (err) {
        // If PATCH fails (404/not found), try creating location (POST /api/mechanic/location)
        if (err.response?.status === 404 || err.response?.data?.message?.includes("create")) {
          try {
            await axios.post("/mechanic/location", {
              longitude: lon,
              latitude: lat
            });
            setTrackingActive(true);
          } catch (createErr) {
            console.error("Failed to initialize mechanic location:", createErr);
          }
        } else {
          console.error("Location update failed:", err);
        }
      }
    };

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setError("");
        
        // Update DB
        updateLocationInBackend(latitude, longitude);
      },
      (err) => {
        console.error("GPS watch error:", err);
        setError("GPS tracking permission denied. Mechanic coordinates are required to accept dispatches.");
        setTrackingActive(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch pending dispatches
  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      // GET /api/mechanic/orders/pending
      const response = await axios.get("/mechanic/orders/pending?limit=20");
      if (response.data?.success) {
        setPendingOrders(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load dispatches:", err);
      setError("Failed to fetch pending dispatches from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeOrder) {
      fetchPendingOrders();
    }
  }, [activeOrder]);

  // Socket triggers and notifications
  useEffect(() => {
    if (!socket) return;

    // A customer submitted a new problem directed to this mechanic
    const handleNewRequest = (populatedProblem) => {
      console.log("Socket new-request:", populatedProblem);
      
      // 1. Show dynamic banner
      setSocketNotification(`⚠️ ALERT: New Roadside Assistance Dispatch Received from ${populatedProblem.userId?.name}!`);
      
      // 2. Automatically pull the new orders list without page refresh!
      fetchPendingOrders();

      // Clear alert banner after 8 seconds
      setTimeout(() => setSocketNotification(""), 8000);
    };

    // Customer cancelled their problem request
    const handleCancelledProblem = (data) => {
      console.log("Socket problem-cancelled:", data);
      
      // If customer cancelled the active order, clear it
      if (activeOrder && activeOrder._id === data.problemId) {
        setActiveOrder(null);
        setError("Active assistance request was cancelled by the customer.");
      } else {
        // Otherwise, refresh pending lists
        fetchPendingOrders();
      }
      
      setSocketNotification(`ℹ️ Notice: Customer cancelled dispatch request.`);
      setTimeout(() => setSocketNotification(""), 6000);
    };

    socket.on("new-request", handleNewRequest);
    socket.on("problem-cancelled", handleCancelledProblem);

    return () => {
      socket.off("new-request", handleNewRequest);
      socket.off("problem-cancelled", handleCancelledProblem);
    };
  }, [socket, activeOrder]);

  // Handle Accept Order
  const handleAcceptOrder = async (problem) => {
    try {
      setActionLoading(problem._id);
      setError("");
      setSuccess("");

      // PATCH /api/mechanic/problem/status
      const response = await axios.patch("/mechanic/problem/status", {
        problemId: problem._id,
        status: "accepted"
      });

      if (response.data?.success) {
        setSuccess("Dispatch accepted successfully! Initializing live route tracking...");
        // Set active order (make sure customer profile fields exist)
        setActiveOrder({
          ...problem,
          status: "accepted"
        });
      }
    } catch (err) {
      console.error("Accept order error:", err);
      setError(err.response?.data?.message || "Failed to accept dispatch");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Decline / Reject Order
  const handleDeclineOrder = async (problemId) => {
    try {
      setActionLoading(problemId);
      setError("");
      setSuccess("");

      // PATCH /api/mechanic/problem/status
      const response = await axios.patch("/mechanic/problem/status", {
        problemId,
        status: "rejected"
      });

      if (response.data?.success) {
        setSuccess("Dispatch request declined successfully.");
        setPendingOrders((prev) => prev.filter((o) => o._id !== problemId));
      }
    } catch (err) {
      console.error("Decline order error:", err);
      setError(err.response?.data?.message || "Failed to decline dispatch");
    } finally {
      setActionLoading(null);
    }
  };

  // Save Fixed Price bid
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!priceInput || isNaN(priceInput)) {
      setError("Please input a valid price amount");
      return;
    }

    try {
      setActionLoading("price");
      setError("");
      
      // PATCH /api/mechanic/problem/fixed-price
      const response = await axios.patch("/mechanic/problem/fixed-price", {
        problemId: activeOrder._id,
        fixedPrice: Number(priceInput)
      });

      if (response.data?.success) {
        setSuccess("Price offer successfully synchronized with client!");
        setActiveOrder((prev) => ({ ...prev, fixedPrice: Number(priceInput) }));
        setPriceSaved(true);
      }
    } catch (err) {
      console.error("Price update error:", err);
      setError(err.response?.data?.message || "Failed to update fixed price");
    } finally {
      setActionLoading(null);
    }
  };

  // Complete Order Job
  const handleCompleteOrder = async () => {
    try {
      setActionLoading("complete");
      setError("");
      
      // PATCH /api/mechanic/problem/status
      const response = await axios.patch("/mechanic/problem/status", {
        problemId: activeOrder._id,
        status: "completed"
      });

      if (response.data?.success) {
        setSuccess("Incident declared resolved! Settle payments now.");
        setActiveOrder(null);
      }
    } catch (err) {
      console.error("Complete order error:", err);
      setError(err.response?.data?.message || "Failed to complete incident");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 text-left py-4">
      {/* Real-time Socket Banner alert notifications */}
      {socketNotification && (
        <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/40 text-blue-300 text-xs font-black flex items-center gap-3 animate-bounce">
          <Radio className="w-5 h-5 text-blue-400 animate-pulse flex-shrink-0" />
          <span>{socketNotification}</span>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Header and GPS telemetry status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-montserrat flex items-center gap-2">
            <Wrench className="w-8 h-8 text-amber-500 text-glow-amber" /> Mechanic Station
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Track dispatches, coordinate live assistance maps, and negotiate flat rates.
          </p>
        </div>

        {/* Live GPS Telemetry indicator */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 self-start text-[10px]">
          <div className={`w-2.5 h-2.5 rounded-full ${trackingActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"}`}></div>
          <span className="font-bold uppercase tracking-wider text-slate-300">
            {trackingActive ? "GPS Telemetry Online" : "GPS Telemetry Off"}
          </span>
          {coords && (
            <span className="text-slate-500 font-semibold border-l border-slate-800 pl-3">
              Lat: {coords.latitude.toFixed(4)}, Lon: {coords.longitude.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* IDLE STATE - Pending Dispatches List */}
      {!activeOrder && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
            <h3 className="text-lg font-bold text-white font-montserrat flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-amber-500" /> Available Emergency Dispatches
            </h3>
            <button
              onClick={fetchPendingOrders}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
            >
              Force Refresh
            </button>
          </div>

          {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-10 h-10 text-amber-500 animate-spin" />
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Syncing dispatch arrays...</span>
              </div>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center flex flex-col items-center gap-4">
              <Award className="w-12 h-12 text-slate-700 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-400">All Operations Clear</h4>
              <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed">
                Currently no active stranded motorist dispatches registered. When a request is raised for you, it will show up here instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingOrders.map((order) => (
                <div
                  key={order._id}
                  className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Motorist details */}
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                        {order.userId?.avatar ? (
                          <img src={order.userId.avatar} alt="strander" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-sm">
                            {order.userId?.name?.charAt(0).toUpperCase() || "C"}
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-white">{order.userId?.name || "Stranded Motorist"}</h4>
                        <span className="text-[9px] text-slate-500">Raised: {new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Breakdown specifics */}
                    <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-3 grid grid-cols-2 gap-2 text-[10px] text-left">
                      <div>
                        <span className="text-slate-500 block uppercase font-bold text-[8px]">Vehicle classification</span>
                        <span className="text-slate-300 font-semibold capitalize">{order.vehicleType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase font-bold text-[8px]">Incident categorization</span>
                        <span className="text-slate-300 font-semibold capitalize">{order.problemType.replace("_", " ")}</span>
                      </div>
                      <div className="col-span-2 mt-1 border-t border-slate-900 pt-1.5">
                        <span className="text-slate-500 block uppercase font-bold text-[8px]">Stranded Landmark Address</span>
                        <span className="text-slate-300 font-medium break-words leading-relaxed">{order.address}</span>
                      </div>
                      {order.additionalNotes && (
                        <div className="col-span-2 mt-1 border-t border-slate-900 pt-1.5">
                          <span className="text-slate-500 block uppercase font-bold text-[8px]">Fault notes</span>
                          <span className="text-slate-400 font-medium break-words leading-relaxed">{order.additionalNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-6 flex gap-3 border-t border-slate-800/40 pt-4">
                    <button
                      onClick={() => handleAcceptOrder(order)}
                      disabled={actionLoading === order._id}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading === order._id ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Accept Dispatch"
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineOrder(order._id)}
                      disabled={actionLoading === order._id}
                      className="py-2.5 px-4 rounded-xl text-[10px] font-bold tracking-wider uppercase bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACCEPTED STATE - Live Tracking, Chat Console & pricing negotiators */}
      {activeOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tracking map & details console (Left) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Strander details banner */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0 shadow-inner">
                  {activeOrder.userId?.avatar ? (
                    <img src={activeOrder.userId.avatar} alt="strander" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-400">
                      {activeOrder.userId?.name?.charAt(0) || "C"}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{activeOrder.userId?.name || "Client Motorist"}</h4>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase border border-emerald-500/20 mt-1 inline-block">
                    Active Dispatch
                  </span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <a
                  href={`tel:${activeOrder.userId?.phone || ""}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-2 text-xs font-bold transition-all shadow-md"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Call Motorist
                </a>
              </div>
            </div>

            {/* Flat Rate pricing bid negotiator */}
            <form onSubmit={handleSavePrice} className="glass-panel p-5 rounded-2xl border border-slate-800 text-left space-y-4">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Flat-Rate Settle Quote
              </div>

              <div className="flex gap-3">
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => { setPriceInput(e.target.value); setPriceSaved(false); }}
                  placeholder="Enter quote amount e.g. 799"
                  disabled={actionLoading === "price"}
                  required
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-300 placeholder-slate-700"
                />
                <button
                  type="submit"
                  disabled={actionLoading === "price" || priceSaved}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all shadow-lg cursor-pointer ${
                    priceSaved
                      ? "bg-slate-900 border border-slate-800 text-slate-500"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10 hover:scale-105 active:scale-95"
                  }`}
                >
                  {actionLoading === "price" ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : priceSaved ? (
                    "Saved & Broadcasted"
                  ) : (
                    "Settle Quote"
                  )}
                </button>
              </div>
              <span className="text-[9px] text-slate-500 block">Settle flat fee on incident fix. Quote gets instantly synced on client dashboard.</span>
            </form>

            {/* Leaflet Map Tracking */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Incident GPS Tracker</h4>
                <span className="text-[9px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Streaming GPS
                </span>
              </div>
              <MapPin className="hidden" />
              <MapTracking
                customerCoords={{ latitude: activeOrder.latitude, longitude: activeOrder.longitude }}
                mechanicCoords={coords}
              />
            </div>

            {/* Dispatch specifics breakdown card */}
            <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-5 text-left grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Vehicle Category</span>
                <span className="text-slate-200 font-semibold capitalize mt-0.5">{activeOrder.vehicleType}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Incident Categorization</span>
                <span className="text-slate-200 font-semibold capitalize mt-0.5">{activeOrder.problemType.replace("_", " ")}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Stranded Landmark Address</span>
                <span className="text-slate-200 font-semibold mt-0.5 break-words leading-relaxed">{activeOrder.address}</span>
              </div>
            </div>

            {/* Complete Job Actions */}
            <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/40 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 max-w-[200px]">Once the technical roadside issue is successfully fixed:</span>
              <button
                onClick={handleCompleteOrder}
                disabled={actionLoading === "complete"}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-emerald-600/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {actionLoading === "complete" ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  "Declare Service Complete"
                )}
              </button>
            </div>

          </div>

          {/* Real-time Chat Window (Right) */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Incident Communications</h4>
            <ChatWindow
              senderId={user.userId}
              receiverId={activeOrder.userId?._id || activeOrder.userId}
              receiverName={activeOrder.userId?.name || "Stranded Motorist"}
            />
          </div>

        </div>
      )}
    </div>
  );
};

export default MechanicDashboard;
