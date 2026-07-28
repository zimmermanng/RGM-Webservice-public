import React, { useState, useEffect, useMemo } from "react";
import { API_BASE } from "../config.ts";

const StructurePage = () => {
  const [einheiten, setEinheiten] = useState([]);
  const [einheitenLaden, setEinheitenLaden] = useState(true);

  const [collapsedNodes, setCollapsedNodes] = useState({});

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);

  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" })

  const [neuerName, setNeuerName] = useState("");
  const [neuesPasswort, setNeuesPasswort] = useState("");
  const [elternId, setElternId] = useState("");

  const [deleteNodeId, setDeleteNodeId] = useState(null);

  // Prüft, ob die aktuell bearbeitete Einheit Kindelemente besitzt
  const hasChildren = editingNodeId
    ? einheiten.some((e) => e.parentId === editingNodeId)
    : false;

  // Wenn Kinder vorhanden sind, ist das Passwort kein Pflichtfeld mehr
  const isFormValid =
    neuerName.trim() !== "" && (hasChildren || neuesPasswort?.trim() !== "");
 
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
            teams.push(object);
            if (object.children.length > 0) {
              object.children.forEach((childrenObject) => {
                teams.push(childrenObject);
                if (childrenObject.children.length > 0) teams.push(...childrenObject.children);
              });
            }
          });
        };
        setEinheiten(teams);
      } catch (err) {
        console.error("Fehler beim Laden der Teamstruktur:", err);
      } finally {
        setEinheitenLaden(false);
      }
    };
    fetchTeams();
  }, []);

  const createTeam = async () => {
    const teamName = neuerName.trim();
    const parentElementId = elternId === "" ? null : parseInt(elternId);
    const res = await fetch(`${API_BASE}/database/create-team`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamName: teamName, parentElementId: parentElementId, password: neuesPasswort }),
    });
    const data = await res.json();
    return data;
  };

  const updateTeam = async () => {
    const teamName = neuerName.trim();
    const res = await fetch(`${API_BASE}/database/update-team`, {
      credentials: "include",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamId: editingNodeId, teamName: teamName, password: neuesPasswort }),
    });
    const data = await res.json();
    return data;
  };

  const deleteTeam = async () => {
    const res = await fetch(`${API_BASE}/database/delete-team`, {
      credentials: "include",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamId: deleteNodeId }),
    });
    const data = await res.json();
    return data;
  };

  const handleNeueEinheitClick = () => {
    setEditingNodeId(null);
    setNeuerName("");
    setNeuesPasswort("");
    setElternId("");
    setConfirmDialog(true);
  };

  const handleEditClick = (node) => {
    setEditingNodeId(node.id);
    setNeuerName(node.name);
    setNeuesPasswort(node.passwort);
    setElternId(node.parentId || "");
    setConfirmDialog(true);
  };

  const handleCancelForm = () => {
    setConfirmDialog(false);
    setEditingNodeId(null);
  };

  const handleSaveForm = async () => {
    if (!isFormValid) return;

    if (editingNodeId) {
      const data = await updateTeam()
      if (!data.ok) setErrorDialog({ open: true, message: data.message });
      else setEinheiten(
        einheiten.map((e) =>
          e.id === editingNodeId
            ? {
              ...e,
              name: neuerName.trim(),
              passwort: neuesPasswort,
              parentId: elternId === "" ? null : elternId,
            }
            : e,
        ),
      );
    } else {
      let neueEinheit = {
        id: null,
        name: neuerName.trim(),
        passwort: neuesPasswort,
        parentId: elternId === "" ? null : elternId,
      };
      const data = await createTeam()
      if (!data.ok) setErrorDialog({ open: true, message: data.message });
      else {
        neueEinheit.id = data.id
        setEinheiten([...einheiten, neueEinheit])
      };
    }

    setConfirmDialog(false);
    setEditingNodeId(null);
  };

  const initiateDelete = (id, name) => {
    if (name === "Administration") {
      alert("Die Administration darf nicht gelöscht werden.");
      return;
    }
    setDeleteNodeId(id);
  };

  const cancelDelete = () => {
    setDeleteNodeId(null);
  };

  const confirmDelete = async () => {
    if (!deleteNodeId) return;
    const data = await deleteTeam();
    if (!data.ok) setErrorDialog({ open: true, message: data.message })
    else setEinheiten(
      einheiten.filter(
        (e) => e.id !== deleteNodeId && e.parentId !== deleteNodeId,
      ),
    );
    setDeleteNodeId(null);
  };

  const toggleNode = (nodeId) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const treeData = useMemo(() => {
    const tree = [];
    const lookup = {};

    einheiten.forEach((e) => {
      lookup[e.id] = { ...e, children: [] };
    });

    einheiten.forEach((e) => {
      if (!e.parentId) {
        tree.push(lookup[e.id]);
      } else if (lookup[e.parentId]) {
        lookup[e.parentId].children.push(lookup[e.id]);
      }
    });

    return tree;
  }, [einheiten]);

  const renderNode = (node, level = 0) => {
    const hasChildren =
      Array.isArray(node.children) && node.children.length > 0;
    const isCollapsed = !!collapsedNodes[node.id];
    const isAdmin = node.name === "Administration";

    return (
      <div
        key={node.id}
        className={`team-tree-item level-${level}`}
        role="treeitem"
        aria-level={level + 1}
        aria-expanded={hasChildren ? !isCollapsed : undefined}
      >
        <div
          className={`team-tree-node is-selectable ${hasChildren ? "is-collapsible" : ""}`}
        >
          <div className="team-tree-label-group">
            {hasChildren ? (
              <button
                type="button"
                className="team-tree-toggle"
                onClick={() => toggleNode(node.id)}
                aria-expanded={!isCollapsed}
                aria-label={`${node.name} umschalten`}
              >
                <span
                  className={`team-tree-chevron ${isCollapsed ? "collapsed" : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
            ) : (
              <span
                className="team-tree-toggle-placeholder"
                aria-hidden="true"
              />
            )}

            <div className="team-tree-label">
              {level === 0 ? (
                <strong>{node.name}</strong>
              ) : (
                <span>{node.name}</span>
              )}
            </div>
          </div>

          {!isAdmin && (
            <div className="action-buttons">
              {/* Bearbeiten Button mit externem SVG */}
              <button
                type="button"
                className="icon-action-button"
                onClick={() => handleEditClick(node)}
                aria-label={`${node.name} bearbeiten`}
                title="Bearbeiten"
              >
                <img src="/edit.svg" alt="Bearbeiten" width="16" height="16" />
              </button>

              {/* Löschen Button mit externem SVG */}
              <button
                type="button"
                className="icon-action-button"
                onClick={() => initiateDelete(node.id, node.name)}
                aria-label={`${node.name} löschen`}
                title="Löschen"
              >
                <img src="/delete.svg" alt="Löschen" width="16" height="16" />
              </button>
            </div>
          )}
        </div>

        {hasChildren && !isCollapsed && (
          <div className="team-tree-children" role="group">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mainContainer">
        <div className="readOnlyTag">Admin</div>
        <h2>Organisationsstruktur</h2>
        <p>
          Passen Sie die Organisationsstruktur an, indem Sie
          Organisationseinheiten hinzufügen, umsortieren oder entfernen. Beachten
          Sie, dass eine drastische Anpassung die langfristige Vergleichbarkeit
          des Reifegradmodells beeinflusst.
        </p>

        <div className="centerContainer structure-actions">
          <button onClick={handleNeueEinheitClick} className="homeButton">
            + Neue Einheit
          </button>
        </div>

        <div className="access-card structure-card">
          {treeData.length === 0 || einheitenLaden ? (
            <p>Keine Organisationseinheiten vorhanden.</p>
          ) : (
            <div
              className="team-tree"
              role="tree"
              aria-label="Hierarchische Teamstruktur"
            >
              {treeData.map((node) => renderNode(node))}
            </div>
          )}
        </div>

        {confirmDialog && (
          <div
            className="modalOverlay"
            role="dialog"
            aria-labelledby="form-modal-title"
            aria-modal="true"
          >
            <div className="modal structure-modal">
              <h2 id="form-modal-title">
                {editingNodeId
                  ? "Bearbeiten"
                  : "Neue Organisationseinheit"}
              </h2>

              <div className="modalInputGroup structure-form-group">
                <div className="form-field">
                  <label className="modal-label">Name der Einheit*</label>
                  <input
                    type="text"
                    value={neuerName}
                    onChange={(e) => setNeuerName(e.target.value)}
                    placeholder="Direktion, Abteilung 3, Referat 12,... "
                    className="modalInput full-width"
                    autoFocus
                  />
                </div>

                {/* Passwort wird nur angezeigt, wenn die Einheit KEINE Kindelemente hat */}
                {!hasChildren && (
                  <div className="form-field">
                    <label className="modal-label">Passwort*</label>
                    <input
                      type="password"
                      value={neuesPasswort}
                      onChange={(e) => setNeuesPasswort(e.target.value)}
                      placeholder="Passwort"
                      className="modalInput full-width"
                    />
                    <p className="hint structure-hint">
                      Hinweis: Es muss ein Passwort gesetzt werden. Durch das
                      Hinzufügen von Kindelementen entfällt die Möglichkeit zur
                      Bearbeitung des Elternelements.
                    </p>
                  </div>
                )}

                {/* Das Elternelement-Feld wird nur beim NEU anlegen angezeigt */}
                {!editingNodeId && (
                  <div className="form-field">
                    <label className="modal-label">
                      Elternelement (Übergeordnete Einheit)*
                    </label>
                    <select
                      value={elternId}
                      onChange={(e) => setElternId(e.target.value)}
                      className="modalInput full-width"
                    >
                      <option value="">
                        -- Top Level (Kein Elternelement) --
                      </option>
                      {einheiten
                        .filter((e) => e.name !== "Administration" && e.childrenLevelsAllowed !== "ZERO")
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                    </select>
                    <p className="hint structure-hint">
                      Hinweis: Sie können Einheiten nur eine Ebene tief
                      verschachteln, daher stehen hier nur die Elternelemente zur
                      Auswahl.
                    </p>
                  </div>
                )}

                {!isFormValid && (
                  <p className="error-text">
                    *Pflichtfeld. Bitte füllen Sie{" "}
                    {hasChildren ? "den Namen" : "Name und Passwort"} aus, um
                    speichern zu können.
                  </p>
                )}
              </div>

              <div className="modalButtons structure-modal-buttons">
                <button
                  onClick={handleCancelForm}
                  className="access-button secondary"
                >
                  Abbrechen
                </button>

                <button
                  onClick={handleSaveForm}
                  className="access-button save-button"
                  disabled={!isFormValid}
                >
                  {editingNodeId ? "Speichern" : "Erstellen"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteNodeId && (
          <div
            className="modalOverlay"
            role="dialog"
            aria-labelledby="delete-modal-title"
            aria-modal="true"
          >
            <div className="modal structure-modal">
              <h2 id="delete-modal-title">Löschen</h2>

              <div className="modalInputGroup structure-form-group">
                <p>
                  Sind Sie sicher, dass Sie diese Organisationseinheit löschen
                  möchten?
                  <br />
                  <br />
                  <div className="hint">
                    <strong>Achtung:</strong> Aktuelle Bearbeitungsfortschritte
                    dieser Einheit, sowie aller Kindelemente, gehen dadurch
                    verloren. Die Ergebnisse aus abgeschlossenen Evaluationszyklen
                    bleiben bestehen.
                  </div>
                </p>
              </div>

              <div className="modalButtons structure-modal-buttons">
                <button
                  onClick={cancelDelete}
                  className="access-button secondary"
                >
                  Abbrechen
                </button>

                <button
                  onClick={confirmDelete}
                  className="access-button delete-confirm-button"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorDialog.open && (
        <div
          className="modalOverlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal">
            <h3>Ein Fehler ist aufgetreten</h3>
            <p>{errorDialog.message}</p>
            <div
              className="modalButtons"
              style={{
                float: "right",
              }}
            >
              <button
                onClick={() => setErrorDialog({ open: false, message: "" })}
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

export default StructurePage;
