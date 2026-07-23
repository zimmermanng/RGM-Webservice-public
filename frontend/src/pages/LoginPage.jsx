import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.ts";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const getFocusableElements = (container) => {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true"
  );
};

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
  const [loading, setLoading] = useState(false);

  const sessionNoticeRef = useRef(null);

  const [globalMessage, setGlobalMessage] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [rowFeedback, setRowFeedback] = useState({});
  const [takeoverDialog, setTakeoverDialog] = useState({
    open: false,
    teamName: "",
    message: "",
  });
  const contentRef = useRef(null);
  const takeoverDialogRef = useRef(null);
  const takeoverPrimaryButtonRef = useRef(null);
  const globalMessageRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  const logoPath = useMemo(() => {
    return activeCompany === "LMZ" ? "/LMZ-Logo.jpg" : "/shuffle-logo.svg";
  }, [activeCompany]);

  const companyLabel = activeCompany === "LMZ" ? "LMZ" : "Shuffle";

  const setGlobalFeedback = (text, type = "status") => {
    setGlobalMessage({ text, type });
  };

  const setFeedbackForTeam = (teamName, message, type = "error") => {
    setRowFeedback({
      [teamName]: {
        message,
        type,
      },
    });
  };

  const closeTakeoverDialog = () => {
    setTakeoverDialog({
      open: false,
      teamName: "",
      message: "",
    });
  };

  const focusInitial = () => {
    if (takeoverPrimaryButtonRef.current) {
      takeoverPrimaryButtonRef.current.focus();
      return;
    }

    const focusables = getFocusableElements(takeoverDialogRef.current);
    if (focusables.length > 0) {
      focusables[0].focus();
    }
  };

  const completeSelection = (data, fallbackTeamName) => {
    console.log("F")
    if (onTeamSelected) {
      onTeamSelected({
        team: data.team || fallbackTeamName,
        teamId: data.teamId || null,
        sessionTimeoutMs: data.sessionTimeoutMs,
        warningBeforeTimeoutMs: data.warningBeforeTimeoutMs,
      });
    }
    console.log("G")
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
        setSelectableTeams(data.teams);
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
    setLoading(true);

    if (!organisation) {
      setError("Ein Team muss ausgewählt werden.");
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (options = {}) => {
    const { forceTakeover = false } = options;

    console.log(options)
    console.log(forceTakeover)

    setGlobalFeedback("", "");
    setSaving(true);
    console.log("A")
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
      console.log("B")
      if (!res.ok) {
        console.log("C")
        if (data.code === "TEAM_LOCKED" || data.code === "ADMIN_LOCKED") {
          const visibleMessage =
            data.message ||
            "Diese Organisationseinheit wird derzeit bereits bearbeitet.";

          setGlobalFeedback(visibleMessage, "warning");
          setFeedbackForTeam(organisation, visibleMessage, "warning");
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

        const fallbackMessage =
          data.message || "Team konnte nicht gespeichert werden";
        setGlobalFeedback(fallbackMessage, "error");
        setFeedbackForTeam(organisation, fallbackMessage, "error");
        return;
      }
      console.log("D")
      const successMessage = forceTakeover
        ? "Die Bearbeitung wurde erfolgreich übernommen."
        : "Organisationseinheit erfolgreich ausgewählt.";

      setGlobalFeedback(successMessage, "success");
      setFeedbackForTeam(organisation, successMessage, "success");
      setTakeoverDialog({
        open: false,
        teamName: "",
        message: "",
      });
      console.log("E")
      completeSelection(data, organisation);
    } catch (err) {
      console.error("Fehler beim Speichern des Teams:", err);
      const fallbackMessage = "Backend nicht erreichbar";
      setGlobalFeedback(fallbackMessage, "error");
      setFeedbackForTeam(organisation, fallbackMessage, "error");
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
          {loadingSelectableTeams ? (
            <p className="access-subtitle">Lade Teamstruktur...</p>
          ) : successfullyLoaded ? (
            <>
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
                  {selectableTeams.map((unit) => (
                    <option
                      value={unit.name}
                      key={unit.name}
                    >{unit.formattedName}</option>
                  ))}
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

                <button type="submit" className="access-button" disabled={loading || !organisation}>
                  {loading ? "Prüfen..." : "Einloggen"}
                </button>
              </form>
            </>
          ) : (
            <p className="access-subtitle">Teams konnten nicht geladen werden.</p>
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
                type="button"
                className="access-button secondary"
                onClick={closeTakeoverDialog}
                disabled={saving}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
