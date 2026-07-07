import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.ts";

const LoginPage = ({
  activeCompany,
  onLoginSuccess,
  sessionNotice,
  onNoticeShown,
}) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionNoticeRef = useRef(null);

  const logoPath = useMemo(() => {
    return activeCompany === "LMZ" ? "/LMZ-Logo.jpg" : "/shuffle-logo.svg";
  }, [activeCompany]);

  const companyLabel = activeCompany === "LMZ" ? "LMZ" : "Shuffle";

  useEffect(() => {
    if (sessionNotice && sessionNoticeRef.current) {
      sessionNoticeRef.current.focus();
    }
  }, [sessionNotice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login fehlgeschlagen");
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess({
          authenticated: true,
          team: data.team || null,
        });
      }

      if (onNoticeShown) {
        onNoticeShown();
      }

      navigate(data.team ? "/start" : "/team-select");
    } catch (err) {
      setError("Backend nicht erreichbar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="access-page">
      <div className="access-card">
        <img
          src={logoPath}
          alt={`${companyLabel} Logo`}
          className="access-logo"
        />

        <h1 className="access-title">Willkommen</h1>
        <p className="access-subtitle">
          Willkommen beim Reifegradmodells des LMZ. Hier können Sie das
          Reifegradmodell für Ihre Organisationseinheit digital ausfüllen und
          auswerten.
        </p>

        {sessionNotice && (
          <div
            ref={sessionNoticeRef}
            className="access-error"
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
          >
            {sessionNotice}
          </div>
        )}
        <form onSubmit={handleSubmit} className="access-form">
          <label htmlFor="login-organisation">Organisationseinheit</label>
          <select
            id="login-organisation"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="access-input"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "login-password-error" : undefined}
          >
            <option value="" disabled>
              Bitte auswählen
            </option>

            {/* Dummy-Daten */}
            <option value="Admin">Admin</option>
            <option value="Direktion">Direktion</option>
            <option value="Abteilung 1">Abteilung 1</option>
            <option value="Abteilung 2">Abteilung 2</option>
            <option value="IT">IT</option>
          </select>
        </form>

        <form onSubmit={handleSubmit} className="access-form">
          <label htmlFor="login-password">Passwort</label>

          <input
            id="login-password"
            type="password"
            placeholder="Passwort eingeben"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="access-input"
          />

          {error && (
            <div
              id="login-password-error"
              className="access-error"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <button type="submit" className="access-button" disabled={loading}>
            {loading ? "Prüfen..." : "Einloggen"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
