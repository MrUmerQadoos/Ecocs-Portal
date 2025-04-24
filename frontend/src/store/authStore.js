import { create } from "zustand";

const API_URL = "http://localhost:3000/api";

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  message: null,

  // Signup
  signup: async (email, password, name, role = "viewer") => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Signup failed");
      set({ isLoading: false, isAuthenticated: true, user: data.user });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      set({ isLoading: false, isAuthenticated: true, user: data.user });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      set({ isLoading: false, isAuthenticated: false, user: null });
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Check Authentication
  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/check-auth`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.user) {
        set({ isAuthenticated: true, user: data.user, isCheckingAuth: false });
      } else {
        set({ isAuthenticated: false, user: null, isCheckingAuth: false });
      }
    } catch (error) {
      set({ isCheckingAuth: false, isAuthenticated: false, user: null, error: error.message });
    }
  },

  // Create User (Admin/Manager)
  createUser: async (name, email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create user");
      set({ isLoading: false, message: data.message });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Get All Users (Admin/Manager/Viewer)
  getUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/users`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch users");
      set({ isLoading: false });
      return data.users;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Create Task (Admin/Manager)
  createTask: async (title, description, assignedTo) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, assignedTo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create task");
      set({ isLoading: false, message: data.message });
      return data.task;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Get Tasks
  getTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch tasks");
      set({ isLoading: false });
      return data.tasks;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Update Task Status
  updateTaskStatus: async (taskId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/tasks/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update task status");
      set({ isLoading: false });
      return data.task;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Get Forms (for Viewer or specific process)
  getForms: async (processId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/assessments/form-one${processId ? `?processId=${processId}` : ""}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch forms");
      set({ isLoading: false });
      return data.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
}));