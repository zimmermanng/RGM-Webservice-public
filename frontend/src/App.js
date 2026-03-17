import React, { useState, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import NavBar from "./components/NavBar/navBar";
// import Footer from "./components/Footer/footer";

import UploadPage from "./pages/UploadPage";
import ResultPage from "./pages/ResultPage";
import Download from "./pages/DownloadPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import DimensionsPage from "./pages/DimensionsPage";
import HomePage from "./pages/HomePage";
import ShuffleHomePage from "./pages/shuffleHomePage";
import RawResults from "./pages/RawResults";
import DimensionsEditPage from "./pages/DimensionsEditPage";

import LoginPage from "./pages/LoginPage";
import TeamSelectionPage from "./pages/TeamSelectionPage";
import ProtectedRoute from "./components/ProtectedRoute";

import { applyTheme } from "./theme";
import "./App.css";

const App = () => {
  const [data, setData] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [team, setTeam] = useState(null);

  const activeCompany = "LMZ"; // "LMZ" oder "Shuffle"

  useEffect(() => {
    applyTheme(activeCompany);
  }, [activeCompany]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3011/auth/me", {
          credentials: "include",
        });

        const data = await res.json();

        setIsAuthenticated(!!data.authenticated);
        setTeam(data.team || null);
      } catch (err) {
        setIsAuthenticated(false);
        setTeam(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
  try {
    await fetch("http://localhost:3011/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    setIsAuthenticated(false);
    setTeam(null);
    setData([]);
  }
};

  const startPageElement = useMemo(() => {
    return activeCompany === "LMZ" ? (
      <HomePage activeCompany={activeCompany} />
    ) : (
      <ShuffleHomePage activeCompany={activeCompany} />
    );
  }, [activeCompany]);

  const showServiceChrome = isAuthenticated && !!team;

  return (
    <Router>
      {showServiceChrome && (
  <NavBar
    activeCompany={activeCompany}
    onLogout={handleLogout}
    team={team}
  />
)}

      <main>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                team ? (
                  <Navigate to="/start" replace />
                ) : (
                  <Navigate to="/team-select" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/login"
            element={
              <LoginPage
                activeCompany={activeCompany}
                logoPath="/logo.png"
                onLoginSuccess={({ authenticated, team }) => {
                  setIsAuthenticated(authenticated);
                  setTeam(team);
                }}
              />
            }
          />

          <Route
            path="/team-select"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={null}
                requireTeam={false}
              >
                <TeamSelectionPage
                  teams={["Team A", "Team B", "Team C"]}
                  onTeamSelected={(selectedTeam) => setTeam(selectedTeam)}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/start"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                {startPageElement}
              </ProtectedRoute>
            }
          />

          <Route
            path="/download"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <Download />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <UploadPage onUpload={setData} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dimensions"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <DimensionsPage activeCompany={activeCompany} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dimensions/bearbeiten"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <DimensionsEditPage activeCompany={activeCompany} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/questionnaire"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <QuestionnairePage activeCompany={activeCompany} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/questionnaire/:dimensionId/:handlungsfeldId"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <QuestionnairePage activeCompany={activeCompany} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <ResultPage data={data} activeCompany={activeCompany} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rawresults"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <RawResults data={data} activeCompany={activeCompany} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/handlungsempfehlungen"
            element={
              <ProtectedRoute
                authChecked={authChecked}
                isAuthenticated={isAuthenticated}
                team={team}
              >
                <ResultPage data={data} activeCompany={activeCompany} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* <Footer /> */}
    </Router>
  );
};

export default App;