import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wrench, LogOut, User as UserIcon, ShieldAlert } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="glass-panel sticky top-4 z-50 rounded-2xl mx-4 my-4 px-6 py-4 flex items-center justify-between shadow-2xl border border-slate-800/60">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
          <Wrench className="w-5 h-5 text-amber-400" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white font-montserrat">
          Mecha<span style={{ color: "#f5c518" }}>Go</span>
        </span>
      </Link>

      {/* Nav Actions */}
      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            {/* User Metadata */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-100">{user.name}</span>
              <span className={`text-[10px] px-2 py-0.5 mt-1 font-bold rounded-full uppercase tracking-wider ${
                user.role === "admin"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : user.role === "mechanic"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}>
                {user.role}
              </span>
            </div>

            {/* Avatar / Profile Icon */}
            <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : user.role === "admin" ? (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {/* Role Dash Shortcut */}
            <Link
              to={`/${user.role}`}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-colors"
            >
              Dashboard
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-slate-300 hover:text-amber-400 font-medium text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 lp-btn-primary-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
