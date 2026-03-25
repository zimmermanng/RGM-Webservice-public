import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3011";

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

const TeamSelectionPage = ({ onTeamSelected }) => {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [globalMessage, setGlobalMessage] = useState({ text: "", type: "" });
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState({});
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

  const setGlobalFeedback = (text, type = "status") => {
    setGlobalMessage({ text, type });
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/teams`, {
          credentials: "include",
        });

        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error(`Server antwortete mit Status ${res.status}`);
        }

        const data = await res.json();
        setTeams(Array.isArray(data.teams) ? data.teams : []);
      } catch (err) {
        console.error("Fehler beim Laden der Teamstruktur:", err);
        setGlobalFeedback("Teamstruktur konnte nicht geladen werden.", "error");
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [navigate]);

  useEffect(() => {
    if (!globalMessage.text) {
      return;
    }

    if (globalMessageRef.current && !takeoverDialog.open) {
      globalMessageRef.current.focus();
    }
  }, [globalMessage, takeoverDialog.open]);

  useEffect(() => {
    if (!takeoverDialog.open) {
      if (contentRef.current) {
        contentRef.current.removeAttribute("inert");
        contentRef.current.removeAttribute("aria-hidden");
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

    if (contentRef.current) {
      contentRef.current.setAttribute("inert", "");
      contentRef.current.setAttribute("aria-hidden", "true");
    }

    document.body.style.overflow = "hidden";

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

    const timeoutId = window.setTimeout(focusInitial, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        closeTakeoverDialog();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = getFocusableElements(takeoverDialogRef.current);
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
          !takeoverDialogRef.current?.contains(activeElement)
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

      if (contentRef.current) {
        contentRef.current.removeAttribute("inert");
        contentRef.current.removeAttribute("aria-hidden");
      }
    };
  }, [takeoverDialog.open, saving]);

  const initialCollapsedState = useMemo(() => {
    const state = {};

    const walk = (nodes, level = 0) => {
      nodes.forEach((node) => {
        if (Array.isArray(node.children) && node.children.length > 0) {
          state[node.id] = level !== 0;
          walk(node.children, level + 1);
        }
      });
    };

    walk(teams, 0);
    return state;
  }, [teams]);

  useEffect(() => {
    if (teams.length > 0) {
      setCollapsedNodes(initialCollapsedState);
    }
  }, [teams, initialCollapsedState]);

  const toggleNode = (nodeId) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const setFeedbackForTeam = (teamName, message, type = "error") => {
    setRowFeedback({
      [teamName]: {
        message,
        type,
      },
    });
  };

  const clearFeedback = () => {
    setGlobalFeedback("", "");
    setRowFeedback({});
  };

  const closeTakeoverDialog = () => {
    setTakeoverDialog({
      open: false,
      teamName: "",
      message: "",
    });
  };

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

  const handleContinue = async (teamName, options = {}) => {
    const { forceTakeover = false } = options;

    setSelectedTeam(teamName);
    clearFeedback();
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/auth/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          team: teamName,
          forceTakeover,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "TEAM_LOCKED") {
          const visibleMessage =
            data.message ||
            "Diese Organisationseinheit wird derzeit bereits bearbeitet.";

          setGlobalFeedback(visibleMessage, "warning");
          setFeedbackForTeam(teamName, visibleMessage, "warning");
          setTakeoverDialog({
            open: true,
            teamName,
            message:
              data.takeoverMessage ||
              "Möchten Sie die aktive Bearbeitung übernehmen? Die andere Person wird dann automatisch abgemeldet.",
          });
          return;
        }

        const fallbackMessage =
          data.message || "Team konnte nicht gespeichert werden";
        setGlobalFeedback(fallbackMessage, "error");
        setFeedbackForTeam(teamName, fallbackMessage, "error");
        return;
      }

      const successMessage = forceTakeover
        ? "Die Bearbeitung wurde erfolgreich übernommen."
        : "Organisationseinheit erfolgreich ausgewählt.";

      setGlobalFeedback(successMessage, "success");
      setFeedbackForTeam(teamName, successMessage, "success");
      setTakeoverDialog({
        open: false,
        teamName: "",
        message: "",
      });

      completeSelection(data, teamName);
    } catch (err) {
      console.error("Fehler beim Speichern des Teams:", err);
      const fallbackMessage = "Backend nicht erreichbar";
      setGlobalFeedback(fallbackMessage, "error");
      setFeedbackForTeam(teamName, fallbackMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const renderNode = (node, level = 0) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isCollapsed = !!collapsedNodes[node.id];
    const isCurrent = selectedTeam === node.name;
    const nodeLabelId = `team-node-label-${node.id}`;
    const nodeHintId = `team-node-hint-${node.id}`;
    const groupId = `team-node-group-${node.id}`;
    const feedbackId = `team-node-feedback-${node.id}`;
    const toggleLabel = isCollapsed
      ? `${node.name} ausklappen`
      : `${node.name} einklappen`;

    const nodeFeedback = rowFeedback[node.name] || null;

    return (
      <div
        key={node.id}
        className="team-tree-item"
        style={{ marginLeft: `${level * 24}px` }}
        role="treeitem"
        aria-level={level + 1}
        aria-expanded={hasChildren ? !isCollapsed : undefined}
        aria-labelledby={nodeLabelId}
        aria-describedby={
          nodeFeedback ? `${nodeHintId} ${feedbackId}` : nodeHintId
        }
      >
        <div
          className={`team-tree-node ${
            node.isSelectable ? "is-selectable" : "is-parent"
          } ${hasChildren ? "is-collapsible" : ""} ${
            nodeFeedback ? `has-${nodeFeedback.type}-feedback` : ""
          }`}
        >
          <div className="team-tree-label-group">
            {hasChildren ? (
              <button
                type="button"
                className="team-tree-toggle"
                onClick={() => toggleNode(node.id)}
                aria-expanded={!isCollapsed}
                aria-controls={groupId}
                aria-label={toggleLabel}
                title={toggleLabel}
              >
                <span
                  className={`team-tree-chevron ${isCollapsed ? "collapsed" : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
            ) : (
              <span className="team-tree-toggle-placeholder" aria-hidden="true" />
            )}

            <div className="team-tree-label">
              {level === 0 ? (
                <strong id={nodeLabelId}>{node.name}</strong>
              ) : (
                <span id={nodeLabelId}>{node.name}</span>
              )}

              <span id={nodeHintId} className="sr-only">
                {node.isSelectable
                  ? "Auswählbare Organisationseinheit."
                  : hasChildren
                  ? "Übergeordnete Organisationseinheit mit untergeordneten Einheiten."
                  : "Nicht auswählbare Organisationseinheit."}
              </span>
            </div>
          </div>

          {node.isSelectable ? (
            <button
              type="button"
              className="access-button"
              onClick={() => handleContinue(node.name)}
              disabled={saving}
              aria-describedby={
                nodeFeedback ? `${nodeHintId} ${feedbackId}` : nodeHintId
              }
              aria-label={`Organisationseinheit ${node.name} auswählen`}
            >
              {saving && isCurrent ? "Speichern..." : "Auswählen"}
            </button>
          ) : (
            <span className="team-tree-hint" aria-hidden="true">
              Übergeordnete Einheit
            </span>
          )}
        </div>

        {nodeFeedback && (
          <div
            id={feedbackId}
            className={`team-row-feedback is-${nodeFeedback.type}`}
            role={nodeFeedback.type === "success" ? "status" : "alert"}
            aria-live={nodeFeedback.type === "success" ? "polite" : "assertive"}
          >
            {nodeFeedback.message}
          </div>
        )}

        {hasChildren && !isCollapsed && (
          <div
            id={groupId}
            className="team-tree-children"
            role="group"
            aria-labelledby={nodeLabelId}
          >
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const globalMessageRole =
    globalMessage.type === "error" || globalMessage.type === "warning"
      ? "alert"
      : "status";

  const globalMessageLive =
    globalMessage.type === "error" || globalMessage.type === "warning"
      ? "assertive"
      : "polite";

  return (
    <div className="access-page">
      <div className="access-card">
        <div ref={contentRef}>
          <h1 className="access-title">Organisationseinheit auswählen</h1>
          <p id="team-selection-help" className="access-subtitle">
            Bitte wählen Sie Ihre Organisationseinheit aus, bevor Sie den Webservice
            betreten. Übergeordnete Einheiten können ein- und ausgeklappt werden.
            Nur auswählbare Einheiten besitzen eine Schaltfläche zum Fortfahren.
          </p>

          {globalMessage.text && (
            <div
              ref={globalMessageRef}
              className="access-error access-error-prominent"
              role={globalMessageRole}
              aria-live={globalMessageLive}
              tabIndex={-1}
            >
              {globalMessage.text}
            </div>
          )}

          {loadingTeams ? (
            <p aria-live="polite">Lade Teamstruktur...</p>
          ) : (
            <div
              className="team-tree"
              role="tree"
              aria-label="Hierarchische Teamstruktur"
              aria-describedby="team-selection-help"
              aria-busy={saving ? "true" : "false"}
            >
              {teams.map((node) => renderNode(node))}
            </div>
          )}
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
                    handleContinue(takeoverDialog.teamName, {
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
      </div>
    </div>
  );
};

export default TeamSelectionPage;