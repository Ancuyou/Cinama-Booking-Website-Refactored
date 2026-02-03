import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import apiClient from "../services/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUserSession = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.post("/auth/introspect", {
          token: accessToken,
        });
        if (response.data.data.valid) {
          const decodedUser = jwtDecode(accessToken);
          const roles = decodedUser.scope ? decodedUser.scope.split(" ") : [];
          setUser({ username: decodedUser.sub, roles });
        } else {
          logOut(); // Server báo token không hợp lệ -> logout
        }
      } catch (error) {
        console.error(
          "5. API Error during /introspect. Calling logOut().",
          error
        );
        logOut(); // API lỗi -> logout
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();
  }, []); // Chỉ chạy 1 lần

  const loginAction = (data) => {
    const { accessToken, refreshToken } = data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    const decodedUser = jwtDecode(accessToken);
    const roles = decodedUser.scope ? decodedUser.scope.split(" ") : [];
    setUser({ username: decodedUser.sub, roles });
  };

  const logOut = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const value = { user, loading, loginAction, logOut };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
