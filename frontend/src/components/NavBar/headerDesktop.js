import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config.ts";
import useDialogFocus from "../../hooks/useDialogFocus";

const NAV_ITEMS = {
  default: [
    { label: "Startseite", to: "/start" },
    { label: "Downloads", to: "/download" },
    { label: "Upload", to: "/upload" },
    { label: "Dimensionen", to: "/dimensions" },
  ],
  LMZ: [
    { label: "Startseite", to: "/start" },
    { label: "Konfigurationsmodus", to: "/dimensions/bearbeiten" },
    { label: "Fragebogen", to: "/dimensions" },
  ],
  ADMIN: [
    { label: "Struktur", to: "/Struktur" },
    { label: "Evaluationsrunden", to: "/Evaluationsrunden" },
  ],
};

const LOGO_BY_COMPANY = {
  LMZ: "/LMZ-Logo.jpg",
  Shuffle: "/shuffle-logo.svg",
  default: "/LMZ-Logo.jpg",
};

function HeaderDesktop({ activeCompany, onLogout, team }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const hamburgerButtonRef = useRef(null);
  const firstMobileLinkRef = useRef(null);
  const [selectableTeams, setSelectableTeams] = useState(null);
  const [loadingSelectableTeams, setLoadingSelectableTeams] = useState(true);
  const [teamView, setTeamView] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingSelectedTeam, setLoadingSelectedTeam] = useState(true);
  const [navigationDestination, setNavigationDestination] = useState(null);
  const [returnDialog, setReturnDialog] = useState({
    open: false,
    message: "",
  });
  const [takeoverDialog, setTakeoverDialog] = useState({
    open: false,
    teamName: "",
    teamId: "",
    previousTeam: "",
  });
  const returnCancelRef = useRef(null);
  const takeoverCancelRef = useRef(null);

  const navItems = useMemo(() => {
    if (team === "Administration") return NAV_ITEMS.ADMIN;
    return NAV_ITEMS[activeCompany] || NAV_ITEMS.default;
  }, [activeCompany, team]);

  const logoSrc = LOGO_BY_COMPANY[activeCompany] || LOGO_BY_COMPANY.default;

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    if (path === "/dimensions") {
      return (
        location.pathname === "/dimensions" ||
        location.pathname.startsWith("/questionnaire")
      );
    }

    if (path === "/dimensions/bearbeiten") {
      return location.pathname.startsWith("/dimensions/bearbeiten");
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus && hamburgerButtonRef.current) {
      window.setTimeout(() => {
        hamburgerButtonRef.current.focus();
      }, 0);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (firstMobileLinkRef.current) {
        firstMobileLinkRef.current.focus();
      }
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    closeMenu(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const fetchTeams = async () => {
      let teams = [];
      try {
        const res = await fetch(`${API_BASE}/auth/teams`, {
          credentials: "include",
        });
        const data = await res.json();
        if (Array.isArray(data.teams)) {
          data.teams.forEach((object) => {
            if (
              object.children.length === 0 &&
              object.name !== "Administration" &&
              object.isSelectable
            )
              teams.push(object);
            if (object.children.length > 0) {
              object.children.forEach((childrenObject) => {
                if (childrenObject.isSelectable) teams.push(childrenObject);
                else if (childrenObject.children.length > 0) {
                  const selectableChildren = childrenObject.children.filter(
                    (obj) => obj.isSelectable,
                  );
                  teams.push(...selectableChildren);
                }
              });
            }
          });
          const adminTeam = data.teams.find((obj) => {
            return obj.name === "Administration";
          });
          if (team === "Administration") teams.push(adminTeam);
        }
        setSelectableTeams(teams);
      } catch (err) {
        console.error("Fehler beim Laden der Teamstruktur:", err);
      } finally {
        setLoadingSelectableTeams(false);
      }
    };
    fetchTeams();
  }, [team]);

  useEffect(() => {
    const getSelectedTeam = async () => {
      try {
        const selectedTeamReq = await fetch(
          `${API_BASE}/session/selected-user`,
          {
            credentials: "include",
          },
        );
        const data = await selectedTeamReq.json();
        setSelectedTeam(data.teamName);
        if (team === "Administration" && data.teamName !== "Administration")
          setTeamView(true);
      } catch (err) {
        console.error("Fehler beim Laden des ausgewählten Teams:", err);
      } finally {
        setLoadingSelectedTeam(false);
      }
    };
    getSelectedTeam();
  }, [team]);

  const handleLogoutClick = async () => {
    closeMenu(false);
    if (onLogout) {
      await onLogout();
    }
  };

  const changeTeam = async (event) => {
    const previousTeam = selectedTeam;
    const viewTeamId = searchTeamId(event.target.value);
    setSelectedTeam(event.target.value);
    if (team === "Administration") {
      if (event.target.value === "Administration") {
        try {
          await teamLogout();
          await deleteTeamView();
        } catch (error) {
          console.error(error);
        }
        setTeamView(false);
        navigate("start");
      } else {
        try {
          const successfulLogin = await teamLogin(event.target.value, false);
          if (!successfulLogin) {
            setTakeoverDialog({
              open: true,
              teamName: event.target.value,
              teamId: viewTeamId,
              previousTeam: previousTeam,
            });
            return;
          }
          await teamLogout();
          await createTeamView(viewTeamId);
        } catch (error) {
          console.error(error);
        }
        setTeamView(true);

        navigate("/dimensions/bearbeiten", { replace: true });
        window.location.reload();
      }
    } else if (event.target.value !== team) {
      try {
        await createTeamView(viewTeamId);
      } catch (error) {
        console.error(error);
      }
      if (window.location.pathname === "/resultReadOnly")
        window.location.reload();
      else navigate("resultReadOnly");
    } else if (event.target.value === team) {
      await deleteTeamView();
      navigate("start");
    }
  };

  const searchTeamId = (teamName) => {
    for (const obj of selectableTeams) {
      if (obj.name === teamName) return obj.id;
    }
    return null;
  };

  const createTeamView = async (viewTeamId) => {
    try {
      await fetch(`${API_BASE}/session/temporary-view`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ viewTeamId: viewTeamId }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTeamView = async () => {
    try {
      await fetch(`${API_BASE}/session/temporary-view`, {
        credentials: "include",
        method: "DELETE",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const teamLogin = async (team, forceTakeover) => {
    try {
      const loginRes = await fetch(`${API_BASE}/auth/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          team: team,
          forceTakeover: forceTakeover,
        }),
      });
      const data = await loginRes.json();
      return data.ok;
    } catch (error) {
      console.error(error);
    }
  };

  const teamLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout-team-view`, {
        credentials: "include",
        method: "DELETE",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = (event, destination) => {
    if (team !== selectedTeam) {
      event.preventDefault();
      setNavigationDestination(destination);
      const returnMessage =
        team === "Administration"
          ? "Wenn Sie fortfahren, verlassen Sie den Schreibmodus und kehren in das Adminpanel zurück."
          : `Sie haben keinen Bearbeitungszugriff für die gewählte Organisationseinheit. Wenn Sie fortfahren, verlassen Sie den Lesemodus und kehren in den Bearbeitungsmodus ihrer eigenen Organisationseinheit (${team}) zurück`;
      setReturnDialog({ open: true, message: returnMessage });
    } else {
      closeMenu(false);
    }
  };

  const confirmPopup = async () => {
    setSelectedTeam(team);
    deleteTeamView();
    if (team === "Administration") {
      await teamLogout();
      setTeamView(false);
    }
    setReturnDialog({ open: false, message: "" });
    navigate(navigationDestination);
    closeMenu(false);
  };

  const closeReturnDialog = () => {
    setReturnDialog({ open: false, message: "" });
  };

  const forcefulLogin = async () => {
    await teamLogin(takeoverDialog.teamName, true);
    await teamLogout();
    await createTeamView(takeoverDialog.teamId);
    setTeamView(true);
    setTakeoverDialog({ open: false, teamName: "", teamId: null });
    window.location.reload();
  };

  const declineLogin = async () => {
    setSelectedTeam(takeoverDialog.previousTeam);
    setTakeoverDialog({
      open: false,
      teamName: "",
      teamId: null,
      previousTeam: "",
    });
  };

  const returnDialogRef = useDialogFocus(returnDialog.open, {
    initialFocusRef: returnCancelRef,
    onClose: closeReturnDialog,
  });
  const takeoverDialogRef = useDialogFocus(takeoverDialog.open, {
    initialFocusRef: takeoverCancelRef,
    onClose: declineLogin,
  });

  const homeTarget = "/start";

  return (
    <>
      <header className="Header">
        <div className="header-inner">
          <div className="logo">
            <Link
              className="logotext"
              to={homeTarget}
              onClick={(event) => handleClick(event, homeTarget)}
            >
              <img src={logoSrc} alt={`${activeCompany || "LMZ"} Logo`} />
              <span className="logo-title">RGM-Prüfwerkzeug</span>
            </Link>
          </div>

          <nav className="nav-desktop" aria-label="Hauptnavigation">
            <ul>
              {navItems.map((item) => {
                const active = isActive(item.to);

                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={active ? "nav-link active" : "nav-link"}
                      aria-current={active ? "page" : undefined}
                      onClick={(event) => handleClick(event, item.to)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="header-actions">
            {team && (
              <div className="team-select-control">
                <label className="team-indicator-label" htmlFor="team-select">
                  Teamansicht
                </label>
                <select
                  id="team-select"
                  className="team-indicator desktop-team-indicator"
                  value={loadingSelectedTeam ? "" : selectedTeam}
                  onChange={changeTeam}
                  disabled={loadingSelectableTeams}
                  aria-describedby="team-select-description team-select-current"
                  aria-busy={loadingSelectableTeams}
                >
                  {loadingSelectableTeams ? (
                    <option value="">Teams werden geladen …</option>
                  ) : (
                    selectableTeams.map((unit) =>
                      unit.children.length > 0 ? (
                        unit.children.map((unitTeam) => (
                          <option
                            key={unitTeam.name}
                            value={unitTeam.name}
                            className="team-indicator-value"
                          >
                            {unit.name} | {unitTeam.name}
                          </option>
                        ))
                      ) : (
                        <option key={unit.name} value={unit.name}>
                          {team === "Administration"
                            ? unit.name === "Administration"
                              ? `⚙️ ${unit.name} (Eigener Bereich)`
                              : `✏️ ${unit.name} (Schreibzugriff)`
                            : unit.name === team
                              ? `✏️ ${unit.name} (Eigener Bereich)`
                              : `👁️ ${unit.name} (Lesezugriff)`}
                        </option>
                      ),
                    )
                  )}
                </select>
                <span id="team-select-description" className="sr-only">
                  Wählen Sie die Organisationseinheit, deren Ansicht Sie öffnen
                  möchten. „Eigener Bereich“ kennzeichnet den Schreibzugriff,
                  „Lesezugriff“ eine schreibgeschützte Ansicht.
                </span>
                <span
                  id="team-select-current"
                  className={`team-select-current ${
                    !loadingSelectedTeam && selectedTeam?.length > 32
                      ? "is-long"
                      : ""
                  }`}
                >
                  {loadingSelectedTeam ? "wird geladen" : selectedTeam}
                </span>
              </div>
            )}

            <button
              type="button"
              className="logout-button desktop-logout-button"
              onClick={handleLogoutClick}
            >
              Logout
            </button>

            <button
              ref={hamburgerButtonRef}
              className="HamburgerMenu"
              type="button"
              onClick={toggleMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              aria-label="Navigation öffnen oder schließen"
            >
              ☰
            </button>
          </div>
        </div>
        {teamView && (
          <div className="admin-toolbar">
            <div className="admin-toolbar-inner">
              {/* Visueller Indikator für den Modus (für Screenreader durch das aria-label der nav abgedeckt) */}
              <span className="admin-badge" aria-hidden="true">
                Ansicht: {selectedTeam}
              </span>

              <nav aria-label="Werkzeuge der Team-Ansicht">
                <ul>
                  <li>
                    <Link
                      to={`/dimensions/bearbeiten`}
                      className={
                        isActive("/dimensions/bearbeiten")
                          ? "nav-link active"
                          : "nav-link"
                      }
                      aria-current={
                        isActive("/dimensions/bearbeiten") ? "page" : undefined
                      }
                    >
                      Konfigurationsmodus
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/dimensions`}
                      className={
                        isActive("/dimensions") ? "nav-link active" : "nav-link"
                      }
                      aria-current={
                        isActive("/dimensions") ? "page" : undefined
                      }
                    >
                      Fragebogen
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}

        {isOpen && (
          <nav
            id="mobile-navigation"
            className="mobile-menu"
            aria-label="Mobile Hauptnavigation"
          >
            <ul>
              {navItems.map((item, index) => {
                const active = isActive(item.to);

                return (
                  <li key={item.to}>
                    <Link
                      ref={index === 0 ? firstMobileLinkRef : null}
                      to={item.to}
                      className={active ? "nav-link active" : "nav-link"}
                      aria-current={active ? "page" : undefined}
                      onClick={() => closeMenu(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {teamView && (
                <li className="mobile-admin-group">
                  <hr className="mobile-divider" aria-hidden="true" />
                  <span className="mobile-admin-heading" id="admin-group-title">
                    Organisationseinheit {selectedTeam}
                  </span>
                  <ul aria-labelledby="admin-group-title">
                    <li>
                      <Link
                        to={`/dimensions/bearbeiten`}
                        className={
                          isActive("/dimensions/bearbeiten")
                            ? "nav-link active"
                            : "nav-link"
                        }
                        aria-current={
                          isActive("/dimensions/bearbeiten")
                            ? "page"
                            : undefined
                        }
                        onClick={() => closeMenu(false)}
                      >
                        Konfigurationsmodus
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/dimensions`}
                        className={
                          isActive("/dimensions")
                            ? "nav-link active"
                            : "nav-link"
                        }
                        aria-current={
                          isActive("/dimensions") ? "page" : undefined
                        }
                        onClick={() => closeMenu(false)}
                      >
                        Fragebogen
                      </Link>
                    </li>
                  </ul>
                </li>
              )}
            </ul>

            <div className="mobile-menu-meta">
              <button
                type="button"
                className="logout-button mobile-logout-button"
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>
      {returnDialog.open && (
        <div className="modalOverlay" role="presentation">
          <div
            ref={returnDialogRef}
            className="modal"
            role="alertdialog"
            aria-labelledby="return-dialog-title"
            aria-describedby="return-dialog-description"
            aria-modal="true"
            tabIndex={-1}
          >
            <h2 id="return-dialog-title">Teamansicht verlassen?</h2>
            <p id="return-dialog-description">{returnDialog.message}</p>
            <div className="modalButtons return-dialog-actions">
              <button ref={returnCancelRef} onClick={closeReturnDialog}>
                In der Teamansicht bleiben
              </button>
              <button onClick={confirmPopup}>
                {team === "Administration"
                  ? "Zum Adminpanel wechseln"
                  : "Zur eigenen Organisationseinheit wechseln"}
              </button>
            </div>
          </div>
        </div>
      )}
      {takeoverDialog.open && (
        <div className="session-timeout-dialog-backdrop" role="presentation">
          <div
            ref={takeoverDialogRef}
            className="session-timeout-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="header-team-takeover-title"
            aria-describedby="header-team-takeover-description"
            tabIndex={-1}
          >
            <h2 id="header-team-takeover-title">Bearbeitung übernehmen?</h2>
            <p id="header-team-takeover-description">
              Möchten Sie die aktive Bearbeitung übernehmen? Die andere Person
              wird dann automatisch abgemeldet.
            </p>
            <p>
              Ausgewählte Organisationseinheit:{" "}
              <strong>{takeoverDialog.teamName}</strong>
            </p>
            <div className="session-timeout-actions">
              <button
                ref={takeoverCancelRef}
                type="button"
                className="access-button"
                onClick={forcefulLogin}
              >
                Bearbeitung übernehmen
              </button>
              <button
                type="button"
                className="access-button secondary"
                onClick={declineLogin}
              >
                Bearbeitung nicht übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HeaderDesktop;
