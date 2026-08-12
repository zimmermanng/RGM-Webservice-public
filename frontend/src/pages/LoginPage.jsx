import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.ts";
import useDialogFocus from "../hooks/useDialogFocus";
import { TeamsContext } from "../context/TeamContext.js";

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

  const [adminLockedDialog, setAdminLockedDialog] = useState({
    open: false,
    teamName: "",
    message: ""
  });
  const adminLockedDialogRef = useRef(null);
  const adminLockedCancelButtonRef = useRef(null);

  const logoPath = useMemo(() => {
    return activeCompany === "LMZ" ? "/LMZ-Logo.jpg" : "/shuffle-logo.svg";
  }, [activeCompany]);

  const companyLabel = activeCompany === "LMZ" ? "LMZ" : "Shuffle";

  const { selectableTeams, loadingSelectableTeams, successfullyLoaded, fetchSelectableTeams } = useContext(TeamsContext);

  useEffect(() => {
    fetchSelectableTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeTakeoverDialog = () => {
    setTakeoverDialog({
      open: false,
      teamName: "",
      message: "",
    });
  };

  const closeAdminLockedDialog = () => {
    setAdminLockedDialog({
      open: false,
      teamName: "",
      message: ""
    });
  };

  useDialogFocus(takeoverDialog.open, {
    dialogRef: takeoverDialogRef,
    initialFocusRef: takeoverCancelButtonRef,
    onClose: closeTakeoverDialog,
    closeOnEscape: !saving,
  });

  useDialogFocus(adminLockedDialog.open, {
    dialogRef: adminLockedDialogRef,
    initialFocusRef: adminLockedCancelButtonRef,
    onClose: closeAdminLockedDialog,
    closeOnEscape: !saving,
  })

  const completeSelection = async (data, fallbackTeamName) => {
    console.log("ABCD")
    if (onLoginSuccess) {
      console.log("Login Success!")
      onLoginSuccess({
        authenticated: true,
        team: data.team || null,
      });
    }
    await fetchSelectableTeams();
    navigate("/start");
  };

  useEffect(() => {
    if (sessionNotice && sessionNoticeRef.current) {
      sessionNoticeRef.current.focus();
    }
  }, [sessionNotice]);

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
        if (data.code === "TEAM_LOCKED") {
          setTakeoverDialog({
            open: true,
            teamName: organisation,
            message:
              data.takeoverMessage ||
              "Möchten Sie die aktive Bearbeitung übernehmen? Die andere Person wird dann automatisch abgemeldet.",
          });
        } else if (data.code === "ADMIN_LOCKED") {
          console.log(data)
          setAdminLockedDialog({
            open: true,
            teamName: organisation,
            message:
              data.message ||
              "Diese Organisationseinheit wird derzeit von der Administration bearbeitet. Ein Zugriff ist derzeit nicht möglich.",
          });
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
      {adminLockedDialog.open && (
        <div
          className="session-timeout-dialog-backdrop"
          role="presentation"
        >
          <div
            ref={adminLockedDialogRef}
            className="session-timeout-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-locked-title"
            aria-describedby="admin-locked-description"
          >
            <p id="admin-locked-description">
              {adminLockedDialog.message}
            </p>
            <p>
              Ausgewählte Organisationseinheit:{" "}
              <strong>{adminLockedDialog.teamName}</strong>
            </p>

            <div className="session-timeout-actions">
              <button
                ref={adminLockedCancelButtonRef}
                type="button"
                className="access-button secondary"
                onClick={closeAdminLockedDialog}
                disabled={saving}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
