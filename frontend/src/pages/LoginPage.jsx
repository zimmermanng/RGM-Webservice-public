import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.ts";
import useDialogFocus from "../hooks/useDialogFocus";

const LoginPage = ({
  activeCompany,
  onLoginSuccess,
  sessionNotice,
  onNoticeShown,
  onTeamSelected
}) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [selectableTeams, setSelectableTeams] = useState([]);
  const [loadingSelectableTeams, setLoadingSelectableTeams] = useState(true);
  const [successfullyLoaded, setSuccessfullyLoaded] = useState(true)
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionNoticeRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [takeoverDialog, setTakeoverDialog] = useState({
    open: false,
    teamName: "",
    message: "",
  });
  const takeoverDialogRef = useRef(null);
  const takeoverPrimaryButtonRef = useRef(null);
  const takeoverCancelButtonRef = useRef(null);

  const logoPath = useMemo(() => {
    return activeCompany === "LMZ" ? "/LMZ-Logo.jpg" : "/shuffle-logo.svg";
  }, [activeCompany]);

  const companyLabel = activeCompany === "LMZ" ? "LMZ" : "Shuffle";

  const closeTakeoverDialog = () => {
    setTakeoverDialog({
      open: false,
      teamName: "",
      message: "",
    });
  };

  useDialogFocus(takeoverDialog.open, {
    dialogRef: takeoverDialogRef,
    initialFocusRef: takeoverCancelButtonRef,
    onClose: closeTakeoverDialog,
    closeOnEscape: !saving,
  });

  const completeSelection = (data, fallbackTeamName) => {
    if (onTeamSelected) {
      onTeamSelected({
        team: data.team || fallbackTeamName,
        teamId: data.teamId || null,
        sessionTimeoutMs: data.sessionTimeoutMs,
        warningBeforeTimeoutMs: data.warningBeforeTimeoutMs,
      });
    }
    navigate("/start");
  };

  useEffect(() => {
    if (sessionNotice && sessionNoticeRef.current) {
      sessionNoticeRef.current.focus();
    }
  }, [sessionNotice]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/selectable-teams`);
        const data = await res.json();
        let teams = data.teams;
        sortTeamsAlphabetically(teams);
        console.log(teams)
        setSelectableTeams(teams);
      } catch (err) {
        setSuccessfullyLoaded(false)
        console.error("Fehler beim Laden der Teamstruktur:", err);
      } finally {
        setLoadingSelectableTeams(false);
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorField("");
    setLoading(true);

    if (!organisation) {
      setError("Ein Team muss ausgewählt werden.");
      setErrorField("organisation");
      setLoading(false);
      window.requestAnimationFrame(() =>
        document.getElementById("login-organisation")?.focus(),
      );
      return;
    }

    if (!password.trim()) {
      setError("Bitte geben Sie das Passwort der Organisationseinheit ein.");
      setErrorField("password");
      setLoading(false);
      window.requestAnimationFrame(() =>
        document.getElementById("login-password")?.focus(),
      );
      return;
    }

    const teamId = selectableTeams.find(obj => obj.name === organisation).id;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password, teamId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login fehlgeschlagen");
        setErrorField("password");
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

      handleContinue()
    } catch (err) {
      setError("Backend nicht erreichbar");
      setErrorField("form");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (options = {}) => {
    const { forceTakeover = false } = options;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          team: organisation,
          forceTakeover,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "TEAM_LOCKED" || data.code === "ADMIN_LOCKED") {
          if (data.code === "TEAM_LOCKED") {
            setTakeoverDialog({
              open: true,
              teamName: organisation,
              message:
                data.takeoverMessage ||
                "Möchten Sie die aktive Bearbeitung übernehmen? Die andere Person wird dann automatisch abgemeldet.",
            });
          }
          return;
        }
        return;
      }

      setTakeoverDialog({
        open: false,
        teamName: "",
        message: "",
      });
      completeSelection(data, organisation);
    } catch (err) {
      console.error("Fehler beim Speichern des Teams:", err);
    } finally {
      setSaving(false);
    }
  }

  const sortTeamsAlphabetically = (teams) => {
    teams.sort((a, b) => {
      const nameA = a.formattedName.toUpperCase();
      const nameB = b.formattedName.toUpperCase();

      if (nameA === "ADMINISTRATION") return 1
      if (nameB === "ADMINISTRATION") return -1

      return nameA.localeCompare(nameB, "de", {
        sensitivity: "base",
        numeric: true,
      })
    });
    return teams
  }

  return (
    <>
      <div className="access-page">
        <div className="access-card">
          <img
            src={logoPath}
            alt={`${companyLabel} Logo`}
            className="access-logo"
          />

          <h1 className="access-title">Willkommen</h1>
          <p className="access-subtitle">
            Willkommen beim Reifegradmodell für Barrierefreiheit des LMZ. Hier können Sie das
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
          {loadingSelectableTeams ? (
            <p className="access-subtitle" role="status" aria-live="polite">
              Teamstruktur wird geladen …
            </p>
          ) : successfullyLoaded ? (
            <form onSubmit={handleSubmit} className="access-form" noValidate>
              <label htmlFor="login-organisation">Organisationseinheit</label>
              <select
                id="login-organisation"
                value={organisation}
                onChange={(e) => {
                  setOrganisation(e.target.value);
                  if (errorField === "organisation") {
                    setError("");
                    setErrorField("");
                  }
                }}
                className="access-input"
                required
                aria-invalid={errorField === "organisation"}
                aria-describedby={
                  errorField === "organisation" ? "login-form-error" : undefined
                }
              >
                <option value="" disabled>
                  Bitte auswählen
                </option>
                {selectableTeams.map((unit) => (
                  <option
                    value={unit.name}
                    key={unit.name}
                  >{unit.formattedName}</option>
                ))}
              </select>

              <label htmlFor="login-password">Passwort</label>

              <input
                id="login-password"
                type="password"
                placeholder="Passwort eingeben"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorField === "password") {
                    setError("");
                    setErrorField("");
                  }
                }}
                className="access-input"
                required
                aria-invalid={errorField === "password"}
                aria-describedby={
                  errorField === "password" ? "login-form-error" : undefined
                }
              />

              {error && (
                <div
                  id="login-form-error"
                  className="access-error"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              <button type="submit" className="access-button" disabled={loading || !organisation}>
                {loading ? "Zugang wird geprüft …" : "Einloggen"}
              </button>
            </form>
          ) : (
            <p className="access-error" role="alert">
              Teams konnten nicht geladen werden. Bitte laden Sie die Seite
              erneut oder wenden Sie sich an die Administration.
            </p>
          )}
        </div>
      </div>
      {takeoverDialog.open && (
        <div
          className="session-timeout-dialog-backdrop"
          role="presentation"
        >
          <div
            ref={takeoverDialogRef}
            className="session-timeout-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="team-takeover-title"
            aria-describedby="team-takeover-description"
          >
            <h2 id="team-takeover-title">Bearbeitung übernehmen?</h2>
            <p id="team-takeover-description">
              {takeoverDialog.message}
            </p>
            <p>
              Ausgewählte Organisationseinheit:{" "}
              <strong>{takeoverDialog.teamName}</strong>
            </p>

            <div className="session-timeout-actions">
              <button
                ref={takeoverPrimaryButtonRef}
                type="button"
                className="access-button"
                onClick={() =>
                  handleContinue({
                    forceTakeover: true,
                  })
                }
                disabled={saving}
              >
                {saving ? "Übernahme läuft..." : "Bearbeitung übernehmen"}
              </button>

              <button
                ref={takeoverCancelButtonRef}
                type="button"
                className="access-button secondary"
                onClick={closeTakeoverDialog}
                disabled={saving}
              >
                Bearbeitung nicht übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
