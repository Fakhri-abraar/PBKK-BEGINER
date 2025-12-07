// pages/_app.tsx

import type { AppProps } from "next/app";
import "bootstrap/dist/css/bootstrap.min.css";
// Pastikan path ke AuthContext benar
import { AuthProvider, useAuth } from "../contexts/AuthContext"; 

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        {/* Mengarahkan ke root (yang seharusnya adalah Public Tasks) */}
        <a className="navbar-brand" href="/">
          Tasks App
        </a>
        <div className="navbar-nav me-auto">
          {/* 1. PUBLIC TASKS */}
          <a className="nav-link" href="/">
            All Posts
          </a>
          
          {/* 2. MY TASKS (Hanya jika login) */}
          {user && (
            // Mengarah ke rute yang benar: /tasks/my
            <a className="nav-link" href="/tasks/my">
              My Tasks
            </a>
          )}
          
          {/* 3. NEW TASK (Hanya jika login) */}
          {user && (
            // Mengarah ke rute yang benar: /tasks/new
            <a className="nav-link" href="/tasks/new">
              New Task
            </a>
          )}
        </div>
        <div className="navbar-nav">
          {user ? (
            <>
              <span className="navbar-text me-3">
                Welcome, **{user.username}**!
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a className="nav-link" href="/auth/login">
                Login
              </a>
              <a className="nav-link" href="/auth/register">
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navigation />
      <div className="container mt-4">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}