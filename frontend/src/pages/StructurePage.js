import React, { useState, useEffect, useMemo, useRef } from "react";
import { API_BASE } from "../config.ts";
import useDialogFocus from "../hooks/useDialogFocus";

const StructurePage = () => {
  const [einheiten, setEinheiten] = useState([]);
  const [einheitenLaden, setEinheitenLaden] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [collapsedNodes, setCollapsedNodes] = useState({});

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);

  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" })
  const [formError, setFormError] = useState("");

  const [neuerName, setNeuerName] = useState("");
  const [neuesPasswort, setNeuesPasswort] = useState("");
  const [elternId, setElternId] = useState("");

  const [deleteNodeId, setDeleteNodeId] = useState(null);
  const formCancelRef = useRef(null);
  const deleteCancelRef = useRef(null);
  const errorCloseRef = useRef(null);
  const formErrorRef = useRef(null);
  const treeItemRefs = useRef(new Map());
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  const [passwordVisibility, setPasswordVisibility] = useState(false)

  // Prüft, ob die aktuell bearbeitete Einheit Kindelemente besitzt
  const hasChildren = editingNodeId
    ? einheiten.some((e) => e.parentId === editingNodeId)
    : false;

  // Wenn Kinder vorhanden sind, ist das Passwort kein Pflichtfeld mehr
  const isFormValid =
    neuerName.trim() !== "" && (hasChildren || (neuesPasswort && neuesPasswort.trim() !== ""));

  useEffect(() => {
    const fetchTeams = async () => {
      let teams = [];
      try {
        const res = await fetch(`${API_BASE}/auth/teams`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Organisationsstruktur konnte nicht geladen werden.");
        }
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
        sortTeamsAlphabetically(teams);
        setEinheiten(teams);
      } catch (err) {
        console.error("Fehler beim Laden der Teamstruktur:", err);
        setLoadError("Organisationsstruktur konnte nicht geladen werden.");
      } finally {
        setEinheitenLaden(false);
      }
    };
    fetchTeams();
  }, []);

  const sortTeamsAlphabetically = (teams) => {
    teams.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();

      if (nameA === "ADMINISTRATION") return 1
      if (nameB === "ADMINISTRATION") return -1

      return nameA.localeCompare(nameB, "de", {
        sensitivity: "base",
        numeric: true,
      })
    });
    return teams
  }

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
    setFormError("");
    setConfirmDialog(true);
  };

  const handleEditClick = (node) => {
    setEditingNodeId(node.id);
    setNeuerName(node.name);
    setNeuesPasswort(node.passwort);
    setElternId(node.parentId || "");
    setFormError("");
    setConfirmDialog(true);
  };

  const handleCancelForm = () => {
    setConfirmDialog(false);
    setEditingNodeId(null);
    setFormError("");
  };

  const handleSaveForm = async () => {
    if (!isFormValid) return;

    setFormError("");

    try {
      if (editingNodeId) {
        const data = await updateTeam();
        if (!data.ok) {
          setFormError(
            data.message ||
            "Die Organisationseinheit konnte nicht gespeichert werden.",
          );
          return;
        }
        let einheitenNeu = einheiten.map((e) =>
          e.id === editingNodeId
            ? {
              ...e,
              name: neuerName.trim(),
              passwort: neuesPasswort,
              parentId: elternId === "" ? null : elternId,
            }
            : e,
        );
        sortTeamsAlphabetically(einheitenNeu)
        setEinheiten(einheitenNeu);
      } else {
        const neueEinheit = {
          id: null,
          name: neuerName.trim(),
          passwort: neuesPasswort,
          parentId: elternId === "" ? null : elternId,
        };
        const data = await createTeam();
        if (!data.ok) {
          setFormError(
            data.message ||
            "Die Organisationseinheit konnte nicht erstellt werden.",
          );
          return;
        }
        console.log(data)
        neueEinheit.id = data.id;
        neueEinheit.childrenLevelsAllowed = data.childrenLevelsAllowed;

        let einheitenNeu = [...einheiten, neueEinheit];
        sortTeamsAlphabetically(einheitenNeu);

        setEinheiten(einheitenNeu);
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Organisationseinheit:", error);
      setFormError(
        "Die Organisationseinheit konnte nicht gespeichert werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      );
      return;
    }

    setConfirmDialog(false);
    setEditingNodeId(null);
  };

  useEffect(() => {
    if (!formError) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      formErrorRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [formError]);

  const initiateDelete = (id, name) => {
    if (name === "Administration") {
      setErrorDialog({
        open: true,
        message:
          "Die Organisationseinheit „Administration“ ist für den Betrieb erforderlich und kann nicht gelöscht werden.",
      });
      return;
    }
    setDeleteNodeId(id);
  };

  const cancelDelete = () => {
    setDeleteNodeId(null);
  };

  const closeErrorDialog = () => {
    setErrorDialog({ open: false, message: "" });
  };

  const formDialogRef = useDialogFocus(confirmDialog, {
    initialFocusRef: formCancelRef,
    onClose: handleCancelForm,
  });
  const deleteDialogRef = useDialogFocus(Boolean(deleteNodeId), {
    initialFocusRef: deleteCancelRef,
    onClose: cancelDelete,
  });
  const errorDialogRef = useDialogFocus(errorDialog.open, {
    initialFocusRef: errorCloseRef,
    onClose: closeErrorDialog,
  });

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

  const visibleTreeNodes = useMemo(() => {
    const visible = [];
    const visit = (nodes, level = 1, parentId = null) => {
      nodes.forEach((node) => {
        visible.push({ node, level, parentId });
        if (node.children.length > 0 && !collapsedNodes[node.id]) {
          visit(node.children, level + 1, node.id);
        }
      });
    };
    visit(treeData);
    return visible;
  }, [treeData, collapsedNodes]);

  useEffect(() => {
    if (
      visibleTreeNodes.length > 0 &&
      !visibleTreeNodes.some(({ node }) => node.id === focusedNodeId)
    ) {
      setFocusedNodeId(visibleTreeNodes[0].node.id);
    }
  }, [visibleTreeNodes, focusedNodeId]);

  const focusTreeItem = (nodeId) => {
    setFocusedNodeId(nodeId);
    window.requestAnimationFrame(() => {
      treeItemRefs.current.get(nodeId)?.focus();
    });
  };

  const handleTreeItemKeyDown = (event, node) => {
    if (event.target !== event.currentTarget) return;

    const currentIndex = visibleTreeNodes.findIndex(
      ({ node: visibleNode }) => visibleNode.id === node.id,
    );
    const hasChildren = node.children.length > 0;
    const isCollapsed = !!collapsedNodes[node.id];
    let nextId = null;

    switch (event.key) {
      case "ArrowDown":
        nextId = visibleTreeNodes[currentIndex + 1]?.node.id;
        break;
      case "ArrowUp":
        nextId = visibleTreeNodes[currentIndex - 1]?.node.id;
        break;
      case "Home":
        nextId = visibleTreeNodes[0]?.node.id;
        break;
      case "End":
        nextId = visibleTreeNodes[visibleTreeNodes.length - 1]?.node.id;
        break;
      case "ArrowRight":
        if (hasChildren && isCollapsed) {
          toggleNode(node.id);
        } else if (hasChildren) {
          nextId = node.children[0].id;
        }
        break;
      case "ArrowLeft": {
        if (hasChildren && !isCollapsed) {
          toggleNode(node.id);
        } else {
          nextId = visibleTreeNodes[currentIndex]?.parentId;
        }
        break;
      }
      case "Enter":
      case " ":
        if (hasChildren) toggleNode(node.id);
        break;
      default:
        return;
    }

    event.preventDefault();
    if (nextId) focusTreeItem(nextId);
  };

  const renderNode = (node, level = 1, index = 0, setSize = 1) => {
    const hasChildren =
      Array.isArray(node.children) && node.children.length > 0;
    const isCollapsed = !!collapsedNodes[node.id];
    const isAdmin = node.name === "Administration";
    const childrenId = `structure-children-${node.id}`;
    const labelId = `structure-label-${node.id}`;

    return (
      <div
        key={node.id}
        className={`team-tree-item level-${level}`}
        role="treeitem"
        aria-level={level}
        aria-posinset={index + 1}
        aria-setsize={setSize}
        aria-expanded={hasChildren ? !isCollapsed : undefined}
        aria-selected={focusedNodeId === node.id}
        aria-labelledby={labelId}
        tabIndex={focusedNodeId === node.id ? 0 : -1}
        ref={(element) => {
          if (element) treeItemRefs.current.set(node.id, element);
          else treeItemRefs.current.delete(node.id);
        }}
        onFocus={(event) => {
          if (event.target === event.currentTarget) setFocusedNodeId(node.id);
        }}
        onKeyDown={(event) => handleTreeItemKeyDown(event, node)}
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
                aria-controls={childrenId}
                aria-label={`${node.name} ${isCollapsed ? "einblenden" : "ausblenden"}`}
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

            <div id={labelId} className="team-tree-label">
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
                <img src="/edit.svg" alt="" width="16" height="16" />
              </button>

              {/* Löschen Button mit externem SVG */}
              <button
                type="button"
                className="icon-action-button"
                onClick={() => initiateDelete(node.id, node.name)}
                aria-label={`${node.name} löschen`}
                title="Löschen"
              >
                <img src="/delete.svg" alt="" width="16" height="16" />
              </button>
            </div>
          )}
        </div>

        {hasChildren && !isCollapsed && (
          <div
            id={childrenId}
            className="team-tree-children"
            role="group"
            aria-label={`Untereinheiten von ${node.name}`}
          >
            {node.children.map((child, childIndex) =>
              renderNode(child, level + 1, childIndex, node.children.length),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mainContainer">
        <p
          className="readOnlyTag"
          id="structure-access-mode"
          aria-label="Zugriffsmodus: Administration"
        >
          Admin
        </p>
        <h1 id="structure-heading" aria-describedby="structure-access-mode">
          Organisationsstruktur
        </h1>
        <p>
          Passen Sie die Organisationsstruktur an, indem Sie
          Organisationseinheiten hinzufügen, umsortieren oder entfernen.<br />
          Beachten Sie, dass eine drastische Anpassung die langfristige Vergleichbarkeit
          des Reifegradmodells beeinflusst.
        </p>

        <div className="centerContainer structure-actions">
          <button onClick={handleNeueEinheitClick} className="homeButton">
            + Neue Einheit
          </button>
        </div>

        <div className="access-card structure-card">
          {einheitenLaden ? (
            <p role="status" aria-live="polite">
              Organisationsstruktur wird geladen …
            </p>
          ) : loadError ? (
            <p className="access-error" role="alert">
              {loadError}
            </p>
          ) : treeData.length === 0 ? (
            <p role="status">Keine Organisationseinheiten vorhanden.</p>
          ) : (
            <div
              className="team-tree"
              role="tree"
              aria-labelledby="structure-heading"
            >
              {treeData.map((node, index) =>
                renderNode(node, 1, index, treeData.length),
              )}
            </div>
          )}
        </div>

        {confirmDialog && (
          <div className="modalOverlay" role="presentation">
            <div ref={formDialogRef} className="modal structure-modal" role="dialog" aria-labelledby="form-modal-title" aria-describedby={`structure-required-help${formError ? " structure-form-error" : ""}`} aria-modal="true" tabIndex={-1}>
              <h2 id="form-modal-title">
                {editingNodeId
                  ? "Bearbeiten"
                  : "Neue Organisationseinheit"}
              </h2>

              <div className="modalInputGroup structure-form-group">
                <div className="form-field">
                  <label className="modal-label" htmlFor="structure-unit-name">Name der Einheit*</label>
                  <input
                    id="structure-unit-name"
                    type="text"
                    value={neuerName}
                    onChange={(e) => {
                      setNeuerName(e.target.value);
                      setFormError("");
                    }}
                    placeholder="Direktion, Abteilung 3, Referat 12,... "
                    className="modalInput full-width"
                    required
                    aria-describedby="structure-required-help"
                  />
                </div>

                {/* Passwort wird nur angezeigt, wenn die Einheit KEINE Kindelemente hat */}
                {!hasChildren && (
                  <div className="form-field">
                    <label className="modal-label" htmlFor="structure-unit-password">Passwort*</label>
                    <input
                      id="structure-unit-password"
                      type={passwordVisibility ? "text" : "password"}
                      value={neuesPasswort}
                      onChange={(e) => {
                        setNeuesPasswort(e.target.value);
                        setFormError("");
                      }}
                      placeholder="Passwort"
                      className="modalInput full-width"
                      required
                      aria-describedby="structure-password-help structure-required-help"
                    />
                    <div className="password-toggle">
                      <input
                        id="show-password-toggle"
                        type="checkbox"
                        placeholder="Passwort anzeigen"
                        onChange={() => setPasswordVisibility(!passwordVisibility)}
                      />
                      <label
                        htmlFor="show-password-toggle"
                      >
                        Passwort anzeigen
                      </label>
                    </div>
                    <p className="hint structure-hint" id="structure-password-help">
                      Hinweis: Es muss zunächst ein Passwort gesetzt werden. Erst durch das
                      Hinzufügen von Kindelementen entfällt die Möglichkeit zur
                      Bearbeitung des Elternelements.
                    </p>
                  </div>
                )}

                {/* Das Elternelement-Feld wird nur beim NEU anlegen angezeigt */}
                {!editingNodeId && (
                  <div className="form-field">
                    <label className="modal-label" htmlFor="structure-parent-unit">
                      Elternelement (Übergeordnete Einheit, optional)
                    </label>
                    <select
                      id="structure-parent-unit"
                      value={elternId}
                      onChange={(e) => {
                        setElternId(e.target.value);
                        setFormError("");
                      }}
                      className="modalInput full-width"
                      aria-describedby="structure-parent-help"
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
                    <p className="hint structure-hint" id="structure-parent-help">
                      Hinweis: Sie können Einheiten nur eine Ebene tief
                      verschachteln, daher stehen hier nur die möglichen Elternelemente zur
                      Auswahl.
                    </p>
                  </div>
                )}

                <p
                  className={isFormValid ? "sr-only" : "error-text"}
                  id="structure-required-help"
                >
                  {isFormValid
                    ? "Mit einem Stern gekennzeichnete Felder sind Pflichtfelder."
                    : `*Pflichtfelder: Bitte füllen Sie ${hasChildren ? "den Namen" : "Name und Passwort"
                    } aus, um speichern zu können.`}
                </p>
                {formError && (
                  <p
                    ref={formErrorRef}
                    id="structure-form-error"
                    className="error-text"
                    role="alert"
                    tabIndex={-1}
                  >
                    {formError}
                  </p>
                )}
              </div>

              <div className="modalButtons structure-modal-buttons">
                <button
                  ref={formCancelRef}
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
          <div className="modalOverlay" role="presentation">
            <div ref={deleteDialogRef} className="modal structure-modal" role="alertdialog" aria-labelledby="delete-modal-title" aria-describedby="delete-modal-description delete-modal-warning" aria-modal="true" tabIndex={-1}>
              <h2 id="delete-modal-title">Löschen</h2>

              <div className="modalInputGroup structure-form-group">
                <p id="delete-modal-description">
                  Sind Sie sicher, dass Sie diese Organisationseinheit löschen
                  möchten?
                </p>
                <div className="hint" id="delete-modal-warning">
                  <strong>Achtung:</strong> Aktuelle Bearbeitungsfortschritte
                  dieser Einheit sowie aller Kindelemente gehen dadurch
                  verloren. Die Ergebnisse aus abgeschlossenen Evaluationszyklen
                  bleiben bestehen.
                </div>
              </div>

              <div className="modalButtons structure-modal-buttons">
                <button
                  ref={deleteCancelRef}
                  onClick={cancelDelete}
                  className="access-button secondary"
                >
                  Organisationseinheit behalten
                </button>

                <button
                  onClick={confirmDelete}
                  className="access-button delete-confirm-button"
                >
                  Organisationseinheit löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div >

      {
        errorDialog.open && (
          <div className="modalOverlay" role="presentation">
            <div ref={errorDialogRef} className="modal" role="alertdialog" aria-modal="true" aria-labelledby="structure-error-title" aria-describedby="structure-error-description" tabIndex={-1}>
              <h3 id="structure-error-title">Ein Fehler ist aufgetreten</h3>
              <p id="structure-error-description">{errorDialog.message}</p>
              <div
                className="modalButtons"
                style={{
                  float: "right",
                }}
              >
                <button
                  ref={errorCloseRef}
                  onClick={closeErrorDialog}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default StructurePage;
