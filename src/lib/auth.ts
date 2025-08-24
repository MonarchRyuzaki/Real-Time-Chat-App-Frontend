'use client';

// Login
export const login = async (username: string, password: string) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  console.log(data);
  if (response.ok) {
    // Save token and user info
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('username', data.username);
    return data;
  } else {
    throw new Error(data.message || 'Login failed');
  }
};

// Register
export const register = async (username: string, password: string) => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.message || 'Registration failed');
  }
};

// Logout
export const logout = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    // We don't need to do anything with the response of the logout endpoint
    // as we are clearing the local storage anyway.
    if (token) {
        await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }
  } catch (error) {
    console.error("Logout request failed, but clearing client-side session anyway.", error);
  }
  
  // Clear local storage regardless of server response
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
};

// Check if user is logged in
export const isAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem('authToken') !== null;
};

// Get current user from localStorage
export const getCurrentUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const username = localStorage.getItem('username');

  if (username) {
    return { username };
  }
  return null;
}
