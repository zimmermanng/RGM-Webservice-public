import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = ({ activeCompany, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const logoPath = useMemo(() => {
    return activeCompany === "LMZ" ? "/lmz-logo.jpg" : "/shuffle-logo.svg";
  }, [activeCompany]);

  const companyLabel = activeCompany === "LMZ" ? "LMZ" : "Shuffle";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3011/auth/login", {
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

        <form onSubmit={handleSubmit} className="access-form">
          <input
            type="password"
            placeholder="Passwort eingeben"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="access-input"
          />

          {error && <div className="access-error">{error}</div>}

          <button type="submit" className="access-button" disabled={loading}>
            {loading ? "Prüfen..." : "Einloggen"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;