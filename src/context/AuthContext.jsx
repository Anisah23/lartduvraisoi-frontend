import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'Artist' or 'Collector'

  // Simulate checking localStorage or API for persisted login
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (storedUser && storedRole) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (userData, userRole, token) => {
    setUser(userData);
    setRole(userData.role === "artist" ? "Artist" : "Collector");
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userData.role); // Store lowercase role for consistency
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
  };

  const value = {
    isLoggedIn,
    user,
    role,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
