import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config.ts";

const NAV_ITEMS = {
  default: [
    { label: "Startseite", to: "/start" },
    { label: "Downloads", to: "/download" },
    { label: "Upload", to: "/upload" },
    { label: "Dimensionen", to: "/dimensions" },
  ],
  LMZ: [
    { label: "Startseite", to: "/" },
    { label: "Konfigurationsmodus", to: "/dimensions/bearbeiten" },
    { label: "Fragebogen", to: "/dimensions" },
  ],
  ADMIN: [
    { label: "Struktur", to: "/" },
    { label: "Evaluationsrunden", to: "/placeholder" },
  ]
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
  const [teams, setTeams] = useState([])
  const [relevantTeams, setRelevantTeams] = useState(null);
  const [loadingRelevantTeams, setLoadingRelevantTeams] = useState(true);
  const [teamView, setTeamView] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [loadingSelectedTeam, setLoadingSelectedTeam] = useState(true)
  const [showPopup, setShowPopup] = useState(false)
  const [navigationDestination, setNavigationDestination] = useState(null)
  const [takeoverDialog, setTakeoverDialog] = useState({
    open: false,
    teamName: "",
    teamId: "",
    previousTeam: "",
  });

  const navItems = useMemo(() => {
    if (team === "Administration") return NAV_ITEMS.ADMIN
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
      let teams = []
      try {
        const res = await fetch(`${API_BASE}/auth/teams`, {
          credentials: "include",
        });
        const data = await res.json();
        if (Array.isArray(data.teams)) {
          setTeams(data.teams)
          data.teams[0].children.forEach(element => {
            let organisationHasChildren = element.children.length > 0 ? true : false;
            if (organisationHasChildren) {
              if (element.children.map(({ name }) => name.includes(team)).includes(true) || team === "Administration") teams.push(element);
            } else if (element.name.includes(team) || team === "Administration") teams.push(element);
          })
          if (team === "Administration") teams.push(data.teams[1]);
        }
        setRelevantTeams(teams);
      } catch (err) {
        console.error("Fehler beim Laden der Teamstruktur:", err);
      } finally {
        setLoadingRelevantTeams(false);
      }
    }
    fetchTeams()
  }, [team]);

  useEffect(() => {
    const getSelectedTeam = async () => {
      try {
        const selectedTeamReq = await fetch(`${API_BASE}/session/selected-user`, {
          credentials: "include",
        });
        const data = await selectedTeamReq.json()
        setSelectedTeam(data.teamName)
        if (team === "Administration" && data.teamName !== "Administration") setTeamView(true)
      } catch (err) {
        console.error("Fehler beim Laden des ausgewählten Teams:", err);
      } finally {
        setLoadingSelectedTeam(false)
      }
    }
    getSelectedTeam()
  }, [team])

  const handleLogoutClick = async () => {
    closeMenu(false);
    if (onLogout) {
      await onLogout();
    }
  };

  const changeTeam = async (event) => {
    const previousTeam = selectedTeam
    setSelectedTeam(event.target.value);
    if (team === "Administration") {
      const viewTeamId = searchTeamId(event.target.value);
      if (event.target.value === "Administration") {
        try {
          await teamLogout()
          await deleteTeamView();
        } catch (error) {
          console.error(error)
        }
        setTeamView(false);
        navigate("start");
      }
      else {
        try {
          const successfulLogin = await teamLogin(event.target.value, false);
          if (!successfulLogin) {
            setTakeoverDialog({ open: true, teamName: event.target.value, teamId: viewTeamId, previousTeam: previousTeam })
            return
          }
          await teamLogout();
          await createTeamView(viewTeamId);
        } catch (error) {
          console.error(error)
        }
        setTeamView(true);
        window.location.reload();
      }
    }
  }

  const searchTeamId = (teamName) => {
    if (teamName === "Administration") return teams[1].id
    for (const element of teams[0].children) {
      let organisationHasChildren = element.children.length > 0 ? true : false;
      if (organisationHasChildren) {
        for (const obj of element.children) {
          if (obj.name === teamName) return obj.id;
        }
      } else if (element.name === teamName) return element.id;
    }
    return null;
  }

  const createTeamView = async (viewTeamId) => {
    try {
      const createRes = await fetch(`${API_BASE}/session/temporary-view`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ viewTeamId: viewTeamId }),
      })
      const data = await createRes.json();
    } catch (error) {
      console.error(error)
    }
  }

  const deleteTeamView = async () => {
    try {
      const deleteRes = await fetch(`${API_BASE}/session/temporary-view`, {
        credentials: "include",
        method: "DELETE",
      })
      const data = await deleteRes.json();
    } catch (error) {
      console.error(error)
    }
  }

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
      return data.ok
    } catch (error) {
      console.error(error)
    }
  }

  const teamLogout = async () => {
    try {
      const logoutRes = await fetch(`${API_BASE}/auth/logout-team-view`, {
        credentials: "include",
        method: "DELETE",
      });
      const data = await logoutRes.json();
    } catch (error) {
      console.error(error)
    }
  }

  const handleClick = (event, destination) => {
    if (team === "Administration" && selectedTeam !== "Administration") {
      event.preventDefault()
      setNavigationDestination(destination)
      setShowPopup(true)
    } else {
      closeMenu(false)
    }
  }

  const confirmPopup = () => {
    setSelectedTeam("Administration")
    teamLogout()
    deleteTeamView()
    setShowPopup(false)
    setTeamView(false)
    navigate(navigationDestination)
    closeMenu(false)
  }

  const forcefulLogin = async () => {
    await teamLogin(takeoverDialog.teamName, true);
    await teamLogout();
    await createTeamView(takeoverDialog.teamId);
    setTeamView(true);
    setTakeoverDialog({ open: false, teamName: "", teamId: null })
    window.location.reload();
  }

  const declineLogin = async () => {
    setSelectedTeam(takeoverDialog.previousTeam)
    setTakeoverDialog({ open: false, teamName: "", teamId: null, previousTeam: "" })
  }

  const homeTarget = activeCompany === "LMZ" ? "/" : "/start";

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
              <select
                id="team-select"
                className="team-indicator desktop-team-indicator"
                aria-label="Team auswählen"
                value={loadingSelectedTeam ? "" : selectedTeam}
                onChange={changeTeam}
              >
                {loadingRelevantTeams ? (
                  <option></option>
                ) :
                  (
                    relevantTeams.map(unit => (
                      unit.children.length > 0 ? unit.children.map(unitTeam => (
                        <option key={unitTeam.name} value={unitTeam.name} className="team-indicator-value">{unit.name} | {unitTeam.name}</option>
                      )) : <option key={unit.name} value={unit.name}>{unit.name}</option>
                    ))
                  )}
              </select>
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

          {teamView &&
            <nav className="nav-desktop-secondary" aria-label="Admin Navigation">
              <ul>
                <li key="/dimensions/bearbeiten">
                  <Link
                    to={`/dimensions/bearbeiten`}
                    className={isActive("/dimensions/bearbeiten") ? "nav-link active" : "nav-link"}
                    aria-current={isActive("/dimensions/bearbeiten") ? "page" : undefined}
                    onClick={() => closeMenu(false)}
                  >
                    Konfigurationsmodus
                  </Link>
                </li>
                <li key="/dimensions">
                  <Link
                    to={`/dimensions`}
                    className={isActive("/dimensions") ? "nav-link active" : "nav-link"}
                    aria-current={isActive("/dimensions") ? "page" : undefined}
                    onClick={() => closeMenu(false)}
                  >
                    Fragebogen
                  </Link>
                </li>
              </ul>
            </nav>
          }
        </div>

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
                <>
                  <li key="/dimensions/bearbeiten">
                    <Link
                      to={`/dimensions/bearbeiten`}
                      className={isActive("/dimensions/bearbeiten") ? "nav-link active" : "nav-link"}
                      aria-current={isActive("/dimensions/bearbeiten") ? "page" : undefined}
                      onClick={() => closeMenu(false)}
                    >
                      Konfigurationsmodus
                    </Link>
                  </li>
                  <li key="/dimensions">
                    <Link
                      to={`/dimensions`}
                      className={isActive("/dimensions") ? "nav-link active" : "nav-link"}
                      aria-current={isActive("/dimensions") ? "page" : undefined}
                      onClick={() => closeMenu(false)}
                    >
                      Fragebogen
                    </Link>
                  </li>
                </>
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
      {showPopup && (
        <div
          className="modalOverlay"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <div className="modal">
            <p>Wenn Sie fortfahren, verlassen Sie den Schreibmodus und kehren in das Adminpanel zurück</p>
            <div className="modalButtons">
              <button onClick={() => setShowPopup(false)}>Bleiben</button>
              <button onClick={confirmPopup}>Zurückkehren</button>
            </div>
          </div>
        </div>
      )}
      {takeoverDialog.open && (
        <div
          className="session-timeout-dialog-backdrop"
          role="presentation"
        >
          <div className="session-timeout-dialog">
            <h2 id="team-takeover-title">Bearbeitung übernehmen?</h2>
            <p>
              Möchten Sie die aktive Bearbeitung übernehmen? Die andere Person wird dann automatisch abgemeldet.
            </p>
            <p>
              Ausgewählte Organisationseinheit:{" "}
              <strong>{takeoverDialog.teamName}</strong>
            </p>
            <div className="session-timeout-actions">
              <button
                type="button"
                className="access-button"
                onClick={forcefulLogin}
              >Bearbeitung übernehmen
              </button>
              <button
                type="button"
                className="access-button secondary"
                onClick={declineLogin}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )
      }
    </>
  );
}

export default HeaderDesktop;