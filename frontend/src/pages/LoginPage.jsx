import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = ({
  activeCompany,
  onLoginSuccess,
  sessionNotice,
  onNoticeShown,
}) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionNoticeRef = useRef(null);

  const logoPath = useMemo(() => {
    return activeCompany === "LMZ" ? "/lmz-logo.jpg" : "/shuffle-logo.svg";
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
      const res = await fetch("/api/auth/login", {
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
          Bitte geben Sie das Passwort ein, um auf den Fragebogen zuzugreifen.
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
          <label htmlFor="login-password">Passwort</label>

          <input
            id="login-password"
            type="password"
            placeholder="Passwort eingeben"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="access-input"
            autoComplete="current-password"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "login-password-error" : undefined}
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