import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
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
import ResultPageReadOnly from "./pages/ResultPageReadOnly.js";
import AdminEvaluationOverallPage from "./pages/AdminEvaluationOverallPage";
import EvaluationPage from "./pages/EvaluationPage.js";
import LoginPage from "./pages/LoginPage";
import TeamSelectionPage from "./pages/TeamSelectionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { API_BASE } from "./config.ts";

import { applyTheme } from "./theme";
import "./App.css";
import StructurePage from "./pages/StructurePage.js";

const CLIENT_WARNING_FALLBACK_MS = 1000 * 60 * 5;
const CLIENT_TIMEOUT_FALLBACK_MS = 1000 * 60 * 60;
const KEEPALIVE_DEBOUNCE_MS = 1000 * 60;
const LOCK_STATUS_POLL_MS = 10000;
const SESSION_TIMEOUT_DISABLED = false;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const getFocusableElements = (container) => {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true",
  );
};

const getPageTitle = (pathname) => {
  const path = pathname.toLowerCase();

  if (path.startsWith("/evaluationsrunden/gesamtauswertung")) {
    return "Gesamtauswertung";
  }
  if (path.startsWith("/questionnaire")) return "Fragebogen";
  if (path.startsWith("/dimensions/bearbeiten")) return "Konfigurationsmodus";
  if (path.startsWith("/results")) return "Ergebnisse";
  if (path.startsWith("/rawresults")) return "Ergebnisse";
  if (path.startsWith("/resultreadonly")) return "Ergebnisse – Leseansicht";
  if (path.startsWith("/handlungsempfehlungen")) return "Handlungsempfehlungen";
  if (path.startsWith("/evaluationsrunden")) return "Evaluationsrunden";
  if (path.startsWith("/struktur")) return "Organisationsstruktur";
  if (path.startsWith("/dimensions")) return "Übersicht Pakete";
  if (path.startsWith("/download")) return "Downloads";
  if (path.startsWith("/upload")) return "Upload";
  if (path.startsWith("/team-select")) return "Organisationseinheit auswählen";
  if (path.startsWith("/login")) return "Anmeldung";
  if (path.startsWith("/start")) return "Startseite";
  return "RGM-Prüfwerkzeug";
};

function RouteDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `${getPageTitle(pathname)} | RGM-Prüfwerkzeug`;
  }, [pathname]);

  return null;
}

function RouteFocusManager() {
  const { pathname } = useLocation();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    if (previousPathRef.current === pathname) {
      return undefined;
    }

    previousPathRef.current = pathname;
    const frameId = window.requestAnimationFrame(() => {
      const mainContent = document.getElementById("main-content");
      mainContent?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  return null;
}

const App = () => {
  const [data, setData] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [team, setTeam] = useState(null);
  const [sessionTimeoutMs, setSessionTimeoutMs] = useState(
    CLIENT_TIMEOUT_FALLBACK_MS,
  );
  const [warningBeforeTimeoutMs, setWarningBeforeTimeoutMs] = useState(
    CLIENT_WARNING_FALLBACK_MS,
  );
  const [warningOpen, setWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(CLIENT_WARNING_FALLBACK_MS / 1000),
  );
  const [sessionNotice, setSessionNotice] = useState("");
  const [warningBusy, setWarningBusy] = useState(false);

  const appShellRef = useRef(null);
  const warningDialogRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastKeepaliveAtRef = useRef(0);
  const warningPrimaryButtonRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  const activeCompany = "LMZ"; // "LMZ" oder "Shuffle"

  useEffect(() => {
    applyTheme(activeCompany);
  }, [activeCompany]);

  const clearInactivityTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const resetWarningState = useCallback(() => {
    setWarningOpen(false);
    setWarningBusy(false);
    setRemainingSeconds(Math.floor(warningBeforeTimeoutMs / 1000));
  }, [warningBeforeTimeoutMs]);

  const handleLogout = useCallback(
    async (options = {}) => {
      const { reason = "", preserveNotice = false } = options;

      clearInactivityTimers();

      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Logout request failed:", err);
      } finally {
        setIsAuthenticated(false);
        setTeam(null);
        setData([]);
        setWarningOpen(false);
        setWarningBusy(false);

        if (preserveNotice && reason) {
          setSessionNotice(reason);
        }
      }
    },
    [clearInactivityTimers],
  );

  const startInactivityTimers = useCallback(
    (timeoutMs, warningMs) => {
      clearInactivityTimers();

      if (SESSION_TIMEOUT_DISABLED) {
        return;
      }

      if (!isAuthenticated || !team) {
        return;
      }

      const safeTimeoutMs = Math.max(timeoutMs, 1000);
      const safeWarningMs = Math.min(
        Math.max(warningMs, 1000),
        Math.max(safeTimeoutMs - 1000, 1000),
      );
      const warningDelayMs = Math.max(safeTimeoutMs - safeWarningMs, 1000);

      setRemainingSeconds(Math.ceil(safeWarningMs / 1000));

      warningTimeoutRef.current = setTimeout(() => {
        setWarningOpen(true);
        setRemainingSeconds(Math.ceil(safeWarningMs / 1000));

        countdownIntervalRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningDelayMs);

      logoutTimeoutRef.current = setTimeout(() => {
        handleLogout({
          preserveNotice: true,
          reason:
            "Ihre Sitzung wurde wegen Inaktivität beendet. Ihre bereits gespeicherten Eingaben bleiben erhalten.",
        });
      }, safeTimeoutMs);
    },
    [clearInactivityTimers, handleLogout, isAuthenticated, team],
  );

  const syncSessionFromResponse = useCallback(
    (payload) => {
      if (!payload || typeof payload !== "object") {
        return;
      }

      if (typeof payload.sessionTimeoutMs === "number") {
        setSessionTimeoutMs(payload.sessionTimeoutMs);
      }

      if (typeof payload.warningBeforeTimeoutMs === "number") {
        setWarningBeforeTimeoutMs(payload.warningBeforeTimeoutMs);
      }

      const nextTimeout =
        typeof payload.sessionTimeoutMs === "number"
          ? payload.sessionTimeoutMs
          : sessionTimeoutMs;

      const nextWarning =
        typeof payload.warningBeforeTimeoutMs === "number"
          ? payload.warningBeforeTimeoutMs
          : warningBeforeTimeoutMs;

      startInactivityTimers(nextTimeout, nextWarning);
    },
    [sessionTimeoutMs, startInactivityTimers, warningBeforeTimeoutMs],
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setIsAuthenticated(false);
          setTeam(null);
          return;
        }

        const data = await res.json();

        setIsAuthenticated(!!data.authenticated);
        setTeam(data.team || null);

        if (typeof data.sessionTimeoutMs === "number") {
          setSessionTimeoutMs(data.sessionTimeoutMs);
        }

        if (typeof data.warningBeforeTimeoutMs === "number") {
          setWarningBeforeTimeoutMs(data.warningBeforeTimeoutMs);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setTeam(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!authChecked) {
      return undefined;
    }

    if (isAuthenticated && team) {
      startInactivityTimers(sessionTimeoutMs, warningBeforeTimeoutMs);
    } else {
      clearInactivityTimers();
      setWarningOpen(false);
    }

    return () => {
      clearInactivityTimers();
    };
  }, [
    authChecked,
    isAuthenticated,
    team,
    sessionTimeoutMs,
    warningBeforeTimeoutMs,
    startInactivityTimers,
    clearInactivityTimers,
  ]);

  const sendKeepalive = useCallback(async () => {
    if (SESSION_TIMEOUT_DISABLED) {
      return;
    }

    const now = Date.now();

    if (now - lastKeepaliveAtRef.current < KEEPALIVE_DEBOUNCE_MS) {
      return;
    }

    lastKeepaliveAtRef.current = now;
    
    try {
      const res = await fetch(`${API_BASE}/auth/keepalive`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await res.json();
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 423) {
          await handleLogout({
            preserveNotice: true,
            reason:
              payload.message ||
              "Ihre Bearbeitungssitzung ist nicht mehr aktiv. Bitte melden Sie sich erneut an.",
          });
        }
        return;
      }
      
      syncSessionFromResponse(payload);
    } catch (error) {
      console.error("Keepalive failed:", error);
    }
  }, [handleLogout, syncSessionFromResponse]);

  const checkLockStatus = useCallback(async () => {
    if (SESSION_TIMEOUT_DISABLED) {
      return;
    }

    if (!isAuthenticated || !team) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/lock-status`, {
        credentials: "include",
      });

      const payload = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 423) {
          await handleLogout({
            preserveNotice: true,
            reason:
              payload.message ||
              "Ihre Bearbeitungssitzung ist nicht mehr aktiv. Bitte melden Sie sich erneut an.",
          });
        }
        return;
      }
    } catch (error) {
      console.error("Lock status check failed:", error);
    }
  }, [handleLogout, isAuthenticated, team]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated || !team) {
      return undefined;
    }

    const handleUserActivity = () => {
      startInactivityTimers(sessionTimeoutMs, warningBeforeTimeoutMs);
      void sendKeepalive();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkLockStatus();
      }
    };

    const eventOptions = { passive: true };
    const activityEvents = [
      "pointerdown",
      "keydown",
      "touchstart",
      "mousemove",
      "focusin",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, eventOptions);
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity, eventOptions);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    authChecked,
    isAuthenticated,
    team,
    sessionTimeoutMs,
    warningBeforeTimeoutMs,
    startInactivityTimers,
    sendKeepalive,
    checkLockStatus,
  ]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated || !team) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void checkLockStatus();
    }, LOCK_STATUS_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [authChecked, isAuthenticated, team, checkLockStatus]);

  useEffect(() => {
    const appShell = appShellRef.current;

    if (!warningOpen) {
      if (appShell) {
        appShell.removeAttribute("inert");
        appShell.removeAttribute("aria-hidden");
      }
      document.body.style.overflow = "";

      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === "function"
      ) {
        previouslyFocusedElementRef.current.focus();
      }

      return undefined;
    }

    previouslyFocusedElementRef.current = document.activeElement;

    if (appShell) {
      appShell.setAttribute("inert", "");
      appShell.setAttribute("aria-hidden", "true");
    }

    document.body.style.overflow = "hidden";

    const focusInitial = () => {
      if (warningPrimaryButtonRef.current) {
        warningPrimaryButtonRef.current.focus();
        return;
      }

      const focusables = getFocusableElements(warningDialogRef.current);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    };

    const timeoutId = window.setTimeout(focusInitial, 0);

    const handleKeyDown = (event) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusables = getFocusableElements(warningDialogRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === first ||
          !warningDialogRef.current?.contains(activeElement)
        ) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      if (appShell) {
        appShell.removeAttribute("inert");
        appShell.removeAttribute("aria-hidden");
      }
    };
  }, [warningOpen]);

  const handleStaySignedIn = async () => {
    setWarningBusy(true);

    try {
      const res = await fetch(`${API_BASE}/auth/keepalive`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await res.json();

      if (!res.ok) {
        await handleLogout({
          preserveNotice: true,
          reason:
            payload.message ||
            "Ihre Sitzung konnte nicht verlängert werden. Bitte melden Sie sich erneut an.",
        });
        return;
      }

      resetWarningState();
      syncSessionFromResponse(payload);
    } catch (error) {
      console.error("Keepalive confirmation failed:", error);
      await handleLogout({
        preserveNotice: true,
        reason:
          "Ihre Sitzung konnte nicht verlängert werden. Bitte melden Sie sich erneut an.",
      });
    } finally {
      setWarningBusy(false);
    }
  };

  const startPageElement = useMemo(() => {
    const isAdmin = team === "Administration";
    return activeCompany === "LMZ" ? (
      <HomePage activeCompany={activeCompany } isAdmin={isAdmin} />
    ) : (
      <ShuffleHomePage activeCompany={activeCompany} />
    );
  }, [activeCompany, team]);

  const showServiceChrome = authChecked && isAuthenticated && !!team;
  const countdownText = `Ihre Sitzung endet in ${remainingSeconds} ${remainingSeconds === 1 ? "Sekunde" : "Sekunden"
    }.`;

  if (!authChecked) {
    return (
      <Router>
        <RouteDocumentTitle />
        <RouteFocusManager />
        <main id="main-content" tabIndex="-1">
          <div className="access-page">
            <div className="access-card">
              <p role="status" aria-live="polite">
                Sitzung wird geprüft …
              </p>
            </div>
          </div>
        </main>
      </Router>
    );
  }

  return (
    <Router>
      <RouteDocumentTitle />
      <RouteFocusManager />
      <a className="skip-link-global" href="#main-content">
        Direkt zum Hauptinhalt springen
      </a>

      <div ref={appShellRef}>
        {showServiceChrome && (
          <NavBar
            activeCompany={activeCompany}
            onLogout={handleLogout}
            team={team}
          />
        )}

        {sessionNotice && !isAuthenticated && (
          <div
            className="access-session-notice"
            role="alert"
            aria-live="assertive"
          >
            {sessionNotice}
          </div>
        )}

        <main id="main-content" tabIndex="-1">
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
              path="/team-select"
              element={
                <ProtectedRoute
                  authChecked={authChecked}
                  isAuthenticated={isAuthenticated}
                  team={null}
                  requireTeam={false}
                >
                  <TeamSelectionPage
                    onTeamSelected={(selection) => {
                      setTeam(selection.team);
                      setSessionNotice("");

                      if (typeof selection.sessionTimeoutMs === "number") {
                        setSessionTimeoutMs(selection.sessionTimeoutMs);
                      }

                      if (
                        typeof selection.warningBeforeTimeoutMs === "number"
                      ) {
                        setWarningBeforeTimeoutMs(
                          selection.warningBeforeTimeoutMs,
                        );
                      }
                    }}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/login"
              element={
                <LoginPage
                  activeCompany={activeCompany}
                  logoPath="/logo.png"
                  onLoginSuccess={({
                    authenticated,
                    team,
                    sessionTimeoutMs,
                    warningBeforeTimeoutMs,
                  }) => {
                    setIsAuthenticated(authenticated);
                    setTeam(team || null);
                    setSessionNotice("");

                    if (typeof sessionTimeoutMs === "number") {
                      setSessionTimeoutMs(sessionTimeoutMs);
                    }

                    if (typeof warningBeforeTimeoutMs === "number") {
                      setWarningBeforeTimeoutMs(warningBeforeTimeoutMs);
                    }
                  }}
                  onTeamSelected={(selection) => {
                    setTeam(selection.team);
                    setSessionNotice("");

                    if (typeof selection.sessionTimeoutMs === "number") {
                      setSessionTimeoutMs(selection.sessionTimeoutMs);
                    }

                    if (
                      typeof selection.warningBeforeTimeoutMs === "number"
                    ) {
                      setWarningBeforeTimeoutMs(
                        selection.warningBeforeTimeoutMs,
                      );
                    }
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
                    onTeamSelected={(selection) => {
                      setTeam(selection.team);
                      setSessionNotice("");

                      if (typeof selection.sessionTimeoutMs === "number") {
                        setSessionTimeoutMs(selection.sessionTimeoutMs);
                      }

                      if (
                        typeof selection.warningBeforeTimeoutMs === "number"
                      ) {
                        setWarningBeforeTimeoutMs(
                          selection.warningBeforeTimeoutMs,
                        );
                      }
                    }}
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
              path="/resultReadOnly"
              element={
                <ProtectedRoute
                  authChecked={authChecked}
                  isAuthenticated={isAuthenticated}
                  team={team}
                >
                  <ResultPageReadOnly activeCompany={activeCompany} />
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
                  <DimensionsEditPage
                    activeCompany={activeCompany}
                    onSessionInvalid={(reason) =>
                      handleLogout({ preserveNotice: true, reason })
                    }
                  />
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

            <Route
              path="/Evaluationsrunden"
              element={
                <ProtectedRoute
                  authChecked={authChecked}
                  isAuthenticated={isAuthenticated}
                  team={team}
                >
                  <EvaluationPage activeCompany={activeCompany} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Struktur"
              element={
                <ProtectedRoute
                  authChecked={authChecked}
                  isAuthenticated={isAuthenticated}
                  team={team}
                >
                  <StructurePage activeCompany={activeCompany} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/evaluationsrunden/gesamtauswertung"
              element={
                <ProtectedRoute
                  authChecked={authChecked}
                  isAuthenticated={isAuthenticated}
                  team={team}
                >
                  <AdminEvaluationOverallPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {warningOpen && (
        <div className="session-timeout-dialog-backdrop" role="presentation">
          <div
            ref={warningDialogRef}
            className="session-timeout-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
            aria-describedby="session-timeout-description session-timeout-countdown"
          >
            <h2 id="session-timeout-title">Sitzung läuft bald ab</h2>
            <p id="session-timeout-description">
              Wegen Inaktivität werden Sie automatisch abgemeldet. Bereits
              gespeicherte Eingaben bleiben erhalten.
            </p>
            <p id="session-timeout-countdown" role="status" aria-live="polite">
              {countdownText}
            </p>

            <div className="session-timeout-actions">
              <button
                ref={warningPrimaryButtonRef}
                type="button"
                className="access-button"
                onClick={handleStaySignedIn}
                disabled={warningBusy}
              >
                {warningBusy
                  ? "Sitzung wird verlängert …"
                  : "Angemeldet bleiben"}
              </button>

              <button
                type="button"
                className="access-button secondary"
                onClick={() =>
                  handleLogout({
                    preserveNotice: true,
                    reason:
                      "Sie wurden erfolgreich abgemeldet. Ihre bereits gespeicherten Eingaben bleiben erhalten.",
                  })
                }
                disabled={warningBusy}
              >
                Jetzt abmelden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <Footer /> */}
    </Router>
  );
};

export default App;
