import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import 'semantic-ui-css/semantic.min.css';
import './App.css';

import { AuthProvider } from './context/auth';
import { ThemeProvider } from './context/theme';
import AuthRoute from './util/AuthRoute';

import MenuBar from './components/MenuBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SinglePost from './pages/SinglePost';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-shell">
            <MenuBar />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/login"
                  element={(
                    <AuthRoute>
                      <Login />
                    </AuthRoute>
                  )}
                />
                <Route
                  path="/register"
                  element={(
                    <AuthRoute>
                      <Register />
                    </AuthRoute>
                  )}
                />
                <Route path="/posts/:postId" element={<SinglePost />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;
