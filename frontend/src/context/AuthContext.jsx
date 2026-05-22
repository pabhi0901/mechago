import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("mechaGo_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("mechaGo_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure axios defaults
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("mechaGo_token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("mechaGo_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("mechaGo_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("mechaGo_user");
    }
    setLoading(false);
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token: receivedToken, userInfo } = response.data;
      
      setToken(receivedToken);
      setUser(userInfo);
      return { success: true, user: userInfo };
    } catch (error) {
      console.error("Login error:", error);
      const message = error.response?.data?.message || "Invalid email or password";
      return { success: false, message };
    }
  };

  const registerCustomer = async (formData) => {
    try {
      // formData is a Multipart Form Data
      const response = await axios.post("/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const { token: receivedToken, userInfo } = response.data;
      
      setToken(receivedToken);
      setUser(userInfo);
      return { success: true, message: "Registered successfully" };
    } catch (error) {
      console.error("Customer registration error:", error);
      const message = error.response?.data?.message || "Registration failed";
      return { success: false, message };
    }
  };

  const registerMechanic = async (formData) => {
    try {
      const response = await axios.post("/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Mechanic registration error:", error);
      const message = error.response?.data?.message || "Registration failed";
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {});
    } catch (error) {
      console.error("Logout backend warning:", error);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateProfilePhoto = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const response = await axios.patch("/api/auth/change-profile-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { userInfo } = response.data;
      setUser(userInfo);
      return { success: true, user: userInfo };
    } catch (error) {
      console.error("Profile photo update error:", error);
      const message = error.response?.data?.message || "Failed to update profile photo";
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerCustomer,
        registerMechanic,
        logout,
        updateProfilePhoto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
