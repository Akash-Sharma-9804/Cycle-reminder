import React from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { DataProvider } from "./DataContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Settings from "./pages/Settings.jsx";

function NavBar() {
  return (
    <header className="flex items-center justify-between max-w-3xl mx-auto px-6 pt-8 pb-4">
      <div className="flex items-center gap-2">
        <motion.span
          className="w-3 h-3 rounded-full bg-blush inline-block"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <h1 className="font-display text-2xl text-plum-900 tracking-tight">Cycle</h1>
      </div>
      <nav className="relative flex gap-1 bg-plum-50 rounded-full p-1">
        {[
          { to: "/", label: "Dashboard", end: true },
          { to: "/settings", label: "Settings", end: false },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive ? "text-moon" : "text-plum-700 hover:text-plum-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-plum-700 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Dashboard />
            </motion.div>
          }
        />
        <Route
          path="/settings"
          element={
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Settings />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <NavBar />
        <main className="max-w-3xl mx-auto px-6 pb-16">
          <AnimatedRoutes />
        </main>
      </BrowserRouter>
    </DataProvider>
  );
}
