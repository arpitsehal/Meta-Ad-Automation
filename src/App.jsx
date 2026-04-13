import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Campaigns from './pages/Campaigns'
import Creative from './pages/Creative'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('chemsroot_auth') === 'true'
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login setAuth={setIsAuthenticated} />
          } 
        />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Layout setAuth={setIsAuthenticated} /> : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Overview />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="creative" element={<Creative />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
