import React, { useState, useEffect } from "react";
import axios from "axios";
import { Shield, CheckCircle2, XCircle, Users, Clock, ToggleLeft, ToggleRight, Loader } from "lucide-react";

const AdminDashboard = () => {
  const [mechanics, setMechanics] = useState([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });

  const fetchMechanics = async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      
      const endpoint = pendingOnly
        ? `/admin/mechanics/pending?page=${page}&limit=10`
        : `/admin/mechanics?page=${page}&limit=10`;
        
      const response = await axios.get(endpoint);
      if (response.data?.success) {
        setMechanics(response.data.data);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1
        });
      }
    } catch (err) {
      console.error("Error fetching mechanics:", err);
      setError("Failed to fetch mechanics list from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics(1);
  }, [pendingOnly]);

  const handleToggleVerification = async (mechanicId) => {
    try {
      setActionLoading(mechanicId);
      setError("");
      setSuccess("");

      const response = await axios.patch(`/admin/toggle-verification/${mechanicId}`);
      if (response.data?.success) {
        const updated = response.data.userInfo;
        setSuccess(`Verification updated for mechanic: ${updated.name}`);
        
        // Remove or update from current list depending on tab filter
        if (pendingOnly) {
          setMechanics((prev) => prev.filter((m) => m._id !== mechanicId));
        } else {
          setMechanics((prev) =>
            prev.map((m) => (m._id === mechanicId ? { ...m, isVerified: updated.isVerified } : m))
          );
        }
      }
    } catch (err) {
      console.error("Toggle verification error:", err);
      setError(err.response?.data?.message || "Failed to update mechanic verification");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 text-left py-4">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-montserrat flex items-center gap-2">
            <Shield className="w-8 h-8 text-rose-500 text-glow-rose" /> Admin Portal
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Perform background audits, verify credentials, and manage mechanic permissions.
          </p>
        </div>

        {/* Dashboard Tabs toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setPendingOnly(true)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              pendingOnly
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/10"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Pending Verification
          </button>
          <button
            onClick={() => setPendingOnly(false)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !pendingOnly
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/10"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            All Registered Mechanics
          </button>
        </div>
      </div>

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

      {/* Main List */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-10 h-10 text-rose-500 animate-spin" />
            <span className="text-xs text-slate-500 font-semibold tracking-wider">Syncing mechanical grid...</span>
          </div>
        </div>
      ) : mechanics.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center border border-slate-800 flex flex-col items-center gap-4">
          <Users className="w-12 h-12 text-slate-700 animate-pulse" />
          <h4 className="text-sm font-bold text-slate-400">No Mechanics Found</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            {pendingOnly
              ? "All registered mechanics are currently verified. No pending applications waiting in queue."
              : "No mechanics records found in the database. Ensure system registrations are online."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mechanics.map((mechanic) => (
            <div
              key={mechanic._id}
              className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between"
            >
              {/* Card Header info */}
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 shadow-inner">
                  {mechanic.avatar ? (
                    <img src={mechanic.avatar} alt={mechanic.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-lg font-bold">
                      {mechanic.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white leading-tight">{mechanic.name}</h3>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        mechanic.isVerified
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {mechanic.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{mechanic.email}</p>
                  <p className="text-[11px] text-slate-400">{mechanic.phone}</p>
                </div>
              </div>

              {/* UPI Holders Details */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-900 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">UPI Holder</span>
                  <span className="text-slate-300 font-medium">{mechanic.upiName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">UPI Address</span>
                  <span className="text-slate-300 font-medium break-all">{mechanic.upiId || "N/A"}</span>
                </div>
              </div>

              {/* Verified toggles action */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-800/40 pt-4">
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Registered: {new Date(mechanic.createdAt).toLocaleDateString()}
                </span>

                <button
                  onClick={() => handleToggleVerification(mechanic._id)}
                  disabled={actionLoading === mechanic._id}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    mechanic.isVerified
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"
                  }`}
                >
                  {actionLoading === mechanic._id ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : mechanic.isVerified ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-400" /> Revoke Access
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-500" /> Approve Mechanic
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => fetchMechanics(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-slate-500 self-center">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchMechanics(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
