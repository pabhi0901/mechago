import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MapTracking from "../components/MapTracking";
import ChatWindow from "../components/ChatWindow";
import { 
  MapPin, AlertTriangle, Hammer, Clipboard, Navigation, Phone, 
  MessageSquare, Loader, XCircle, DollarSign, CheckCircle2 
} from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Location States
  const [coords, setCoords] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [mockingLocation, setMockingLocation] = useState(false);
  const [inputLat, setInputLat] = useState("12.9716"); // Default Bangalore
  const [inputLon, setInputLon] = useState("77.5946");

  // Nearby Mechanics
  const [nearbyMechanics, setNearbyMechanics] = useState([]);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [radius, setRadius] = useState(5);
  const [searchingMechanics, setSearchingMechanics] = useState(false);

  // Form Inputs
  const [vehicleType, setVehicleType] = useState("car");
  const [problemType, setProblemType] = useState("puncture");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  // Request Lifecycle States
  const [activeProblem, setActiveProblem] = useState(() => {
    const saved = localStorage.getItem("mechaGo_active_problem");
    return saved ? JSON.parse(saved) : null;
  });
  const [problemStatus, setProblemStatus] = useState(() => activeProblem?.status || "idle"); // idle, pending, accepted, completed, cancelled, rejected

  // Moving Mechanic Live Location
  const [mechanicLiveCoords, setMechanicLiveCoords] = useState(null);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync active problem with localStorage
  useEffect(() => {
    if (activeProblem) {
      localStorage.setItem("mechaGo_active_problem", JSON.stringify(activeProblem));
      setProblemStatus(activeProblem.status);
    } else {
      localStorage.removeItem("mechaGo_active_problem");
      setProblemStatus("idle");
      setMechanicLiveCoords(null);
    }
  }, [activeProblem]);

  // Request browser location on mount
  useEffect(() => {
    requestBrowserLocation();
  }, []);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser geolocation is not supported");
      setLocationDenied(true);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setLocationDenied(false);
        setMockingLocation(false);
        setLoading(false);
      },
      (err) => {
        console.error("Location request error:", err);
        setError("Location permission denied. Enter coordinates manually or mock location to find mechanics.");
        setLocationDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMockLocation = () => {
    const lat = parseFloat(inputLat);
    const lon = parseFloat(inputLon);
    if (isNaN(lat) || isNaN(lon)) {
      setError("Invalid mock coordinates");
      return;
    }
    setCoords({ latitude: lat, longitude: lon });
    setLocationDenied(false);
    setMockingLocation(true);
    setError("");
  };

  // Fetch Nearby Mechanics when coordinates are loaded
  const fetchNearbyMechanics = async () => {
    if (!coords) return;
    try {
      setSearchingMechanics(true);
      setError("");
      
      const response = await axios.get(
        `/api/customer/mechanics/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&radiusKm=${radius}`
      );
      
      if (response.data?.success) {
        // Filter out unverified/blocked if returned, but display verified mechanics
        setNearbyMechanics(response.data.data);
      }
    } catch (err) {
      console.error("Nearby search error:", err);
      setError("Failed to locate nearby approved responders");
    } finally {
      setSearchingMechanics(false);
    }
  };

  useEffect(() => {
    if (coords && problemStatus === "idle") {
      fetchNearbyMechanics();
    }
  }, [coords, radius, problemStatus]);

  // Fetch latest problem status from backend and update UI
  const fetchActiveProblemStatus = async (problemId) => {
    try {
      const response = await axios.get(`/api/customer/problem/${problemId}`);
      if (response.data?.success && response.data?.data) {
        const updatedProblem = response.data.data;
        setActiveProblem(updatedProblem);

        if (updatedProblem.status === "accepted") {
          setSuccess("Emergency Request Accepted! Mechanic is now driving to your location.");
          setError("");
        } else if (updatedProblem.status === "rejected") {
          setActiveProblem(null);
          setError("Your request was declined by the mechanic. Please choose another mechanic.");
          setSuccess("");
        } else if (updatedProblem.status === "completed") {
          setSuccess("Emergency Assistance Resolved!");
          setError("");
        }
      }
    } catch (err) {
      console.error("Error fetching latest problem details:", err);
    }
  };

  // Connect socket listeners to track live status updates from mechanic
  useEffect(() => {
    if (!socket || !activeProblem) return;

    const handleStatusUpdatedSocket = (data) => {
      console.log("Socket problem update received:", data);
      if (data.problemId === activeProblem._id) {
        // Fetch fresh populated status details from backend API instantly
        fetchActiveProblemStatus(activeProblem._id);
      }
    };

    const handleCancelledByMechanic = (data) => {
      console.log("Socket request-cancelled:", data);
      if (data.problemId === activeProblem._id) {
        setActiveProblem(null);
        setError("Your request was cancelled or cleared by the responder.");
      }
    };

    socket.on("problem-status-updated", handleStatusUpdatedSocket);
    socket.on("request-accepted", handleStatusUpdatedSocket);
    socket.on("request-rejected", handleStatusUpdatedSocket);
    socket.on("problem-cancelled", handleCancelledByMechanic);

    return () => {
      socket.off("problem-status-updated", handleStatusUpdatedSocket);
      socket.off("request-accepted", handleStatusUpdatedSocket);
      socket.off("request-rejected", handleStatusUpdatedSocket);
      socket.off("problem-cancelled", handleCancelledByMechanic);
    };
  }, [socket, activeProblem]);

  // Periodically poll nearby mechanics API to track the moving mechanic's live location
  useEffect(() => {
    if (problemStatus !== "accepted" || !activeProblem || !coords) return;

    const trackMechanicLocation = async () => {
      try {
        // Request nearby mechanics with a wide radius (100km) to locate our moving responder
        const response = await axios.get(
          `/api/customer/mechanics/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&radiusKm=100`
        );
        if (response.data?.success) {
          const mechDetails = response.data.data.find(
            (entry) => entry._id === activeProblem.mechanicId?._id || entry._id === activeProblem.mechanicId
          );
          if (mechDetails && mechDetails.coordinates) {
            setMechanicLiveCoords(mechDetails.coordinates);
          }
        }
      } catch (err) {
        console.error("Error polling mechanic coordinates:", err);
      }
    };

    // Track instantly, then every 8 seconds
    trackMechanicLocation();
    const interval = setInterval(trackMechanicLocation, 8000);

    return () => clearInterval(interval);
  }, [problemStatus, activeProblem, coords]);

  // Submit emergency problem to chosen mechanic
  const handleRaiseProblem = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedMechanic) {
      setError("Please select a nearby mechanic to dispatch the request to");
      return;
    }

    if (!coords) {
      setError("GPS coordinates are required to submit help request");
      return;
    }

    if (!address.trim()) {
      setError("Please describe the physical address or road landmark");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("mechanicId", selectedMechanic._id);
      formData.append("vehicleType", vehicleType);
      formData.append("problemType", problemType);
      formData.append("address", address.trim());
      formData.append("latitude", coords.latitude);
      formData.append("longitude", coords.longitude);
      formData.append("additionalNotes", notes.trim());

      if (photoFile) {
        formData.append("photos", photoFile); // Single photo
      }
      if (videoFile) {
        formData.append("video", videoFile);
      }

      // POST /api/customer/problem
      const response = await axios.post("/api/customer/problem", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data?.success) {
        setActiveProblem(response.data.data);
        setSuccess("Emergency Request Broadcasted! Waiting for mechanic response...");
      }
    } catch (err) {
      console.error("Submit problem error:", err);
      setError(err.response?.data?.message || "Failed to submit help request");
    } finally {
      setLoading(false);
    }
  };

  // Cancel problem request
  const handleCancelRequest = async () => {
    if (!activeProblem) return;
    try {
      setLoading(true);
      setError("");
      
      const response = await axios.patch("/api/customer/problem/cancel", {
        problemId: activeProblem._id
      });
      
      if (response.data?.success) {
        setActiveProblem(null);
        setSuccess("Your emergency assistance request has been cancelled.");
      }
    } catch (err) {
      console.error("Cancel request error:", err);
      setError("Failed to cancel active help request");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveProblem = () => {
    // Clear state so customer can raise a new problem
    setActiveProblem(null);
    setSelectedMechanic(null);
    setAddress("");
    setNotes("");
    setPhotoFile(null);
    setVideoFile(null);
  };

  return (
    <div className="space-y-8 text-left py-4">
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

      {/* Geolocation check console (Only in idle state) */}
      {problemStatus === "idle" && !coords && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Location Authorization Required</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                To connect with nearby mechanic response units, we require your exact physical geographic coordinates. Enable browser location or input mock coordinates below.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Mock Latitude</label>
              <input
                type="text"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                placeholder="12.9716"
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Mock Longitude</label>
              <input
                type="text"
                value={inputLon}
                onChange={(e) => setInputLon(e.target.value)}
                placeholder="77.5946"
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              />
            </div>
            <button
              onClick={handleMockLocation}
              className="py-3 px-4 rounded-xl font-bold bg-amber-600/15 border border-amber-600/30 text-amber-400 text-xs uppercase hover:bg-amber-600/30 transition-all self-end cursor-pointer"
            >
              Mock Location Coordinates
            </button>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800/40 pt-4">
            <span className="text-[10px] text-slate-500">Or wait for hardware GPS ping...</span>
            <button
              onClick={requestBrowserLocation}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition-all"
            >
              {loading ? "Hardware Ping Active..." : "Retry Hardware Location Service"}
            </button>
          </div>
        </div>
      )}

      {/* IDLE STATE - Problem Form & Mechanics List */}
      {problemStatus === "idle" && coords && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Dispatch/Raise problem form (Left) */}
          <form onSubmit={handleRaiseProblem} className="lg:col-span-7 glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-montserrat">Report Vehicle Emergency</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Please populate the roadside diagnostic form details below.</p>
              </div>
            </div>

            {/* Selected Mechanic Info */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-left">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Assigned Dispatch Unit</span>
              {selectedMechanic ? (
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                      {selectedMechanic.avatar ? (
                        <img src={selectedMechanic.avatar} alt={selectedMechanic.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold">{selectedMechanic.name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{selectedMechanic.name}</h4>
                      <span className="text-[9px] text-blue-400">ETA: {selectedMechanic.arrivalTimeMinutes || 15} mins away</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMechanic(null)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                  >
                    Reselect
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-500 font-medium py-1">
                  ⚠️ Select a verified responder from the right-hand nearby list first.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vehicle Type */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle Category</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-300"
                >
                  <option value="car">Car (Standard/Sedan/SUV)</option>
                  <option value="bike">Bike (Motorcycle)</option>
                  <option value="scooter">Scooter/Moped</option>
                  <option value="auto">Auto-Rickshaw</option>
                  <option value="e-rickshaw">E-Rickshaw</option>
                  <option value="truck">Truck/Commercial</option>
                  <option value="bus">Bus/Coach</option>
                  <option value="other">Other Vehicle Type</option>
                </select>
              </div>

              {/* Problem Type */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Problem Type</label>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-300"
                >
                  <option value="puncture">Flat Tire / Puncture</option>
                  <option value="battery_discharge">Dead Battery / Discharge</option>
                  <option value="engine_failure">Engine Failure / Stall</option>
                  <option value="fuel_empty">Empty Fuel / Gas Tank</option>
                  <option value="overheating">Radiator Overheating</option>
                  <option value="brake_issue">Brake System Failure</option>
                  <option value="starter_issue">Starter Motor Issue</option>
                  <option value="electrical_issue">Electrical Fuse Issue</option>
                  <option value="accident">Accident / Collision</option>
                  <option value="clutch_issue">Clutch Cable / Transmission</option>
                  <option value="chain_issue">Broken Chain / Drive</option>
                  <option value="towing_required">Towing Service Requested</option>
                  <option value="other">Other Technical Glitch</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Emergency Address / Road Landmark</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Describe your location e.g. NH-44 near Expressway toll gate"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-300"
              />
            </div>

            {/* Additional Notes */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fault Symptom Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide details e.g. clicking noise from engine, smoke under hood"
                rows="3"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-300"
              />
            </div>

            {/* File Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Problem Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diagnostic Video (Optional)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Coordinates check */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-900">
              <span className="font-semibold">GPS Lat: {coords.latitude.toFixed(5)}</span>
              <span className="font-semibold">GPS Lon: {coords.longitude.toFixed(5)}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${mockingLocation ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-400"}`}>
                {mockingLocation ? "Mock GPS" : "Hardware Lock"}
              </span>
            </div>

            {/* Submit Trigger */}
            <button
              type="submit"
              disabled={loading || !selectedMechanic}
              className="w-full py-3.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Dispatch Emergency Request <Navigation className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Nearby Mechanics List (Right) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-montserrat flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500 text-glow-blue" /> Nearby Dispatchers
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Found {nearbyMechanics.length} responders within {radius}km</p>
              </div>

              {/* Radius select */}
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg text-slate-400 px-2 py-1 text-xs"
              >
                <option value={2}>2 Km</option>
                <option value={5}>5 Km</option>
                <option value={10}>10 Km</option>
                <option value={25}>25 Km</option>
                <option value={50}>50 Km</option>
              </select>
            </div>

            {searchingMechanics ? (
              <div className="min-h-[30vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Locating mechanic arrays...</span>
                </div>
              </div>
            ) : nearbyMechanics.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center flex flex-col items-center gap-4">
                <MapPin className="w-10 h-10 text-slate-700 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-400">No Responders Found</h4>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed mx-auto">
                  Try extending search radius in parameters, or coordinates mock locations to locate active mechanics.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {nearbyMechanics.map((mech) => (
                  <div
                    key={mech._id}
                    onClick={() => setSelectedMechanic(mech)}
                    className={`p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${
                      selectedMechanic?._id === mech._id
                        ? "bg-blue-600/10 border-blue-500/80 shadow-md shadow-blue-500/5"
                        : "glass-card border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 relative">
                        {mech.avatar ? (
                          <img src={mech.avatar} alt={mech.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-sm">
                            {mech.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></span>
                      </div>

                      <div className="text-left space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-200">{mech.name}</h4>
                        <p className="text-[9px] text-slate-400 flex items-center gap-1">
                          🚗 Drive dist: {mech.distanceKm ? `${mech.distanceKm} km` : "Route loading..."}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          📍 Straight: {mech.straightDistanceKm} km
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 block">
                        {mech.arrivalTimeMinutes ? `${mech.arrivalTimeMinutes} mins` : "15 mins"}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-850 text-slate-400 border border-slate-800">
                        {mech.routeUnavailable ? "Straight line" : "OSRM Route"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* PENDING STATE - Waiting for Mechanic Acceptance */}
      {problemStatus === "pending" && activeProblem && (
        <div className="max-w-2xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8 text-center relative overflow-hidden">
          <div className="absolute w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[100px] -top-10 -left-10"></div>
          
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center animate-pulse">
              <Loader className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white font-montserrat">Locating Dispatch Responder...</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              We have broadcasted your technical diagnostic profile details to the selected mechanic response unit. Please stay on this gateway console.
            </p>
          </div>

          {/* Broadcast Summary Details card */}
          <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs relative z-10">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[9px]">Vehicle Type</span>
              <span className="text-slate-200 font-semibold capitalize mt-0.5">{activeProblem.vehicleType}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[9px]">Issue Classification</span>
              <span className="text-slate-200 font-semibold capitalize mt-0.5">{activeProblem.problemType.replace("_", " ")}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block uppercase font-bold text-[9px]">Stranded Landmark Address</span>
              <span className="text-slate-200 font-semibold mt-0.5 break-words">{activeProblem.address}</span>
            </div>
          </div>

          {/* Cancellation control */}
          <div className="flex flex-col items-center gap-3 relative z-10">
            <button
              onClick={handleCancelRequest}
              disabled={loading}
              className="px-6 py-3 bg-rose-600/15 hover:bg-rose-600/35 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 cursor-pointer"
            >
              {loading ? "Cancelling Dispatch Request..." : "Abort Emergency Request"}
            </button>
            <span className="text-[10px] text-slate-600">Aborting clears coordinates and allows routing a new mechanic.</span>
          </div>
        </div>
      )}

      {/* ACCEPTED STATE - Map Live Tracking, Chat Console & Price */}
      {problemStatus === "accepted" && activeProblem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tracking Map & Assistance Info (Left) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Mechanic details banner */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex justify-between items-center text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0 shadow-inner">
                  {activeProblem.mechanicId?.avatar ? (
                    <img src={activeProblem.mechanicId.avatar} alt="Mechanic" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-400">
                      {activeProblem.mechanicId?.name?.charAt(0) || "M"}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{activeProblem.mechanicId?.name || "Response Unit"}</h4>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase border border-blue-500/20 mt-1 inline-block">
                    On the Way
                  </span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <a
                  href={`tel:${activeProblem.mechanicId?.phone || ""}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-2 text-xs font-bold transition-all shadow-md"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Call Responder
                </a>
              </div>
            </div>

            {/* Leaflet Map panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interactive Assistance Route</h4>
                <span className="text-[9px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span> Live Tracking Active
                </span>
              </div>
              <MapPin className="hidden" /> {/* prefetch visual placeholder anchor */}
              <MapTracking
                customerCoords={{ latitude: activeProblem.latitude, longitude: activeProblem.longitude }}
                mechanicCoords={mechanicLiveCoords}
              />
            </div>

            {/* Assistance breakdown details */}
            <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-5 text-left grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Vehicle Category</span>
                <span className="text-slate-200 font-semibold capitalize mt-0.5">{activeProblem.vehicleType}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Incident Type</span>
                <span className="text-slate-200 font-semibold capitalize mt-0.5">{activeProblem.problemType.replace("_", " ")}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Incident Price</span>
                <span className="text-emerald-400 font-bold mt-0.5 flex items-center">
                  <DollarSign className="w-3.5 h-3.5" /> {activeProblem.fixedPrice !== null ? `${activeProblem.fixedPrice} INR` : "Bidding Price..."}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Assistance status</span>
                <span className="text-blue-400 font-semibold capitalize mt-0.5">{activeProblem.status.replace("_", " ")}</span>
              </div>
            </div>
            
            {/* Cancel trigger */}
            <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/40 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 max-w-[200px]">If the technician has resolved the hardware issue or you need to abort:</span>
              <button
                onClick={handleCancelRequest}
                className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold"
              >
                Abort Assistance
              </button>
            </div>

          </div>

          {/* Real-time Chat Window (Right) */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Responder Communications</h4>
            <ChatWindow
              senderId={user.userId}
              receiverId={activeProblem.mechanicId?._id || activeProblem.mechanicId}
              receiverName={activeProblem.mechanicId?.name || "Responder Unit"}
            />
          </div>

        </div>
      )}

      {/* COMPLETED STATE - Service Done, Invoices & Pay details */}
      {problemStatus === "completed" && activeProblem && (
        <div className="max-w-2xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8 text-center relative overflow-hidden">
          <div className="absolute w-[60%] h-[60%] bg-emerald-600/5 rounded-full blur-[100px] -top-10 -left-10"></div>
          
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-white font-montserrat">Emergency Assistance Resolved</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Your mechanical issue has been declared fixed by the responder. Please check your hardware diagnostics and settle payments.
            </p>
          </div>

          {/* Invoice Summary */}
          <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-6 text-left space-y-4 relative z-10">
            <h4 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Clipboard className="w-4 h-4" /> Service invoice details
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-900 pb-4">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Responder Name</span>
                <span className="text-slate-200 font-semibold mt-0.5">{activeProblem.mechanicId?.name || "Responded Technician"}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Vehicle category</span>
                <span className="text-slate-200 font-semibold capitalize mt-0.5">{activeProblem.vehicleType}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">UPI Address for payment</span>
                <span className="text-blue-400 font-bold mt-0.5 break-all">
                  {activeProblem.mechanicId?.upiId || "N/A"}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Holder: {activeProblem.mechanicId?.upiName || "N/A"}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block uppercase font-bold text-[9px]">Total Amount</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 flex items-center justify-end">
                  <DollarSign className="w-5 h-5" /> {activeProblem.fixedPrice || 499} INR
                </span>
              </div>
            </div>
          </div>

          {/* Pay Button & complete */}
          <div className="flex flex-col items-center gap-4 relative z-10">
            <a
              href={`upi://pay?pa=${activeProblem.mechanicId?.upiId || ""}&pn=${activeProblem.mechanicId?.upiName || ""}&am=${activeProblem.fixedPrice || ""}&cu=INR`}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Pay via UPI Client App
            </a>
            <button
              onClick={handleResolveProblem}
              className="text-xs text-slate-500 hover:text-slate-300 font-semibold underline cursor-pointer"
            >
              Done, Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
