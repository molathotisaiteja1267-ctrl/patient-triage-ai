import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSummary, HospitalSummary, TokenResponse, RoleEnum } from '../services/types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserSummary | null;
  hospital: HospitalSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isTriageNurse: boolean;
  isNurse: boolean;
  isReceptionist: boolean;
  login: (hospitalCode: string, email: string, password: string) => Promise<TokenResponse>;
  registerHospital: (payload: any) => Promise<TokenResponse>;
  setSession: (authData: TokenResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [hospital, setHospital] = useState<HospitalSummary | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveAuthSession = useCallback((authData: TokenResponse) => {
    localStorage.setItem('auth_token', authData.access_token);
    setToken(authData.access_token);
    setUser(authData.user);
    setHospital(authData.hospital);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setHospital(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('auth_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
      setHospital(res.hospital);
      setToken(res.access_token);
      localStorage.setItem('auth_token', res.access_token);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (hospitalCode: string, email: string, password: string): Promise<TokenResponse> => {
    const authData = await api.login({
      hospital_code: hospitalCode,
      email,
      password,
    });
    saveAuthSession(authData);
    return authData;
  };

  const registerHospital = async (payload: any): Promise<TokenResponse> => {
    const authData = await api.registerHospital(payload);
    return authData;
  };

  const role = user?.role;
  const isAdmin = role === 'HOSPITAL_ADMIN' || role === 'PLATFORM_ADMIN';
  const isDoctor = role === 'DOCTOR';
  const isTriageNurse = role === 'TRIAGE_NURSE';
  const isNurse = role === 'NURSE';
  const isReceptionist = role === 'RECEPTIONIST';

  return (
    <AuthContext.Provider
      value={{
        user,
        hospital,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAdmin,
        isDoctor,
        isTriageNurse,
        isNurse,
        isReceptionist,
        login,
        registerHospital,
        setSession: saveAuthSession,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
