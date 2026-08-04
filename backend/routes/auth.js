const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");

const SESSION_TIMEOUT_MS =
  Number(process.env.SESSION_TIMEOUT_MS) || 1000 * 60 * 60 * 24 * 365 * 10;
const SESSION_WARNING_MS =
  Number(process.env.SESSION_WARNING_MS) || 1000 * 60 * 5;

function buildTree(nodes, parentId = null) {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "de")
    )
    .map((node) => ({
      id: node.id,
      name: node.name,
      parentId: node.parentId,
      childrenLevelsAllowed: node.childrenLevelsAllowed,
      isSelectable: node.isSelectable,
      isActive: node.isActive,
      children: buildTree(nodes, node.id),
    }));
}

function getLockExpiryDate() {
  return new Date(Date.now() + SESSION_TIMEOUT_MS);
}

function getRemainingMs(expiresAt) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

async function releaseExpiredLocks() {
  return;
}

async function releaseSessionLocks(sessionId, exceptTeamId = null) {
  const where = {
    sessionId,
  };

  if (exceptTeamId !== null) {
    where.teamId = {
      not: exceptTeamId,
    };
  }

  await prisma.teamSessionLock.deleteMany({ where });
}

async function acquireTeamLock(teamId, sessionId) {
  await releaseExpiredLocks();

  const existingLock = await prisma.teamSessionLock.findUnique({
    where: { teamId },
  });

  if (!existingLock) {
    try {
      return await prisma.teamSessionLock.create({
        data: {
          teamId,
          sessionId,
          expiresAt: getLockExpiryDate(),
        },
      });
    } catch (error) {
      if (error.code !== "P2002") {
        throw error;
      }
    }
  }

  const currentLock = await prisma.teamSessionLock.findUnique({
    where: { teamId },
  });

  if (!currentLock) {
    return await prisma.teamSessionLock.create({
      data: {
        teamId,
        sessionId,
        expiresAt: getLockExpiryDate(),
      },
    });
  }

  if (currentLock.sessionId === sessionId) {
    return await prisma.teamSessionLock.update({
      where: { teamId },
      data: {
        lastActivityAt: new Date(),
        expiresAt: getLockExpiryDate(),
      },
    });
  }

  const sessionAdminLock = await prisma.teamSessionLock.findMany({
    where: {
      AND: [
        { sessionId: currentLock.sessionId },
        { teamId: 57 }
      ]
    },
  })

  if (sessionAdminLock.length !== 0) {
    const adminError = new Error("ADMIN_LOCKED")
    adminError.code = "ADMIN_LOCKED";
    adminError.lock = currentLock;
    throw adminError;
  }

  const error = new Error("TEAM_LOCKED");
  error.code = "TEAM_LOCKED";
  error.lock = currentLock;
  throw error;
}

async function takeOverTeamLock(teamId, sessionId) {
  await releaseExpiredLocks();

  const existingLock = await prisma.teamSessionLock.findUnique({
    where: { teamId },
  });

  if (!existingLock) {
    return prisma.teamSessionLock.create({
      data: {
        teamId,
        sessionId,
        expiresAt: getLockExpiryDate(),
      },
    });
  }

  return prisma.teamSessionLock.update({
    where: { teamId },
    data: {
      sessionId,
      lockedAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: getLockExpiryDate(),
    },
  });
}

async function refreshLock(teamId, sessionId) {
  await releaseExpiredLocks();

  const currentLock = await prisma.teamSessionLock.findUnique({
    where: { teamId },
  });

  if (!currentLock) {
    const error = new Error("TEAM_LOCK_MISSING");
    error.code = "TEAM_LOCK_MISSING";
    throw error;
  }

  if (currentLock.sessionId !== sessionId) {
    const error = new Error("TEAM_LOCK_TAKEN_OVER");
    error.code = "TEAM_LOCK_TAKEN_OVER";
    error.lock = currentLock;
    throw error;
  }

  return prisma.teamSessionLock.update({
    where: { teamId },
    data: {
      lastActivityAt: new Date(),
      expiresAt: getLockExpiryDate(),
    },
  });
}

async function deleteTeamView(teamId) {
  try {
    if (!teamId) return
    const existingTeamView = await prisma.teamView.findUnique({
      where: { sessionTeamId: teamId }
    })

    if (existingTeamView) {
      const deleteTempView = await prisma.teamView.delete({
        where: {
          sessionTeamId: teamId,
        }
      })
    }
  } catch (error) {
    console.error("Fehler:", error)
  }
}

// Login
router.post("/login", async (req, res) => {
  const { password } = req.body;
  const { teamId } = req.body;

  const team = await prisma.team.findUnique({
    where: {
      id: teamId
    }
  })

  if (!team) {
    return res.status(404).json({
      ok: false,
      message: "Das Team konnte nicht gefunden werden.",
    });
  }

  const passwordCheck = await bcrypt.compare(password, team.passwordHash);

  if (!passwordCheck) {
    return res.status(401).json({
      ok: false,
      message: "Falsches Passwort",
    });
  }

  try {
    await releaseSessionLocks(req.session.id);

    req.session.authenticated = true;
    req.session.team = null;
    req.session.teamId = null;

    return res.json({
      ok: true,
      authenticated: true,
      team: null,
      teamId: null,
      sessionTimeoutMs: SESSION_TIMEOUT_MS,
      warningBeforeTimeoutMs: SESSION_WARNING_MS,
    });
  } catch (error) {
    console.error("Fehler beim Login:", error);
    return res.status(500).json({
      ok: false,
      message: "Login fehlgeschlagen",
    });
  }
});

// Current auth state
router.get("/me", async (req, res) => {
  try {
    if (req.session.authenticated && req.session.teamId) {
      await releaseExpiredLocks();
    }

    let lockInfo = null;

    if (req.session.authenticated && req.session.teamId) {
      const lock = await prisma.teamSessionLock.findUnique({
        where: { teamId: req.session.teamId },
      });

      if (lock && lock.sessionId === req.session.id) {
        lockInfo = {
          ownsLock: true,
          expiresAt: lock.expiresAt,
          remainingMs: getRemainingMs(lock.expiresAt),
        };
      } else if (lock) {
        lockInfo = {
          ownsLock: false,
          expiresAt: lock.expiresAt,
          remainingMs: getRemainingMs(lock.expiresAt),
        };
      } else {
        lockInfo = {
          ownsLock: false,
          expiresAt: null,
          remainingMs: 0,
        };
      }
    }

    return res.json({
      authenticated: !!req.session.authenticated,
      team: req.session.team || null,
      teamId: req.session.teamId || null,
      sessionTimeoutMs: SESSION_TIMEOUT_MS,
      warningBeforeTimeoutMs: SESSION_WARNING_MS,
      lock: lockInfo,
    });
  } catch (error) {
    console.error("Fehler beim Laden des Auth-Status:", error);
    return res.status(500).json({
      ok: false,
      message: "Auth-Status konnte nicht geladen werden",
    });
  }
});

// Passive lock status check without extending the lock
router.get("/lock-status", async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({
      ok: false,
      code: "NOT_AUTHENTICATED",
      message: "Nicht eingeloggt",
    });
  }

  if (!req.session.team || !req.session.teamId) {
    return res.status(403).json({
      ok: false,
      code: "NO_TEAM_SELECTED",
      message: "Kein Team ausgewählt",
    });
  }

  try {
    await releaseExpiredLocks();

    const lock = await prisma.teamSessionLock.findUnique({
      where: { teamId: req.session.teamId },
    });

    if (!lock) {
      return res.status(423).json({
        ok: false,
        code: "TEAM_LOCK_EXPIRED",
        message:
          "Ihre Bearbeitungssitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
      });
    }

    if (lock.sessionId !== req.session.id) {
      return res.status(423).json({
        ok: false,
        code: "TEAM_LOCK_TAKEN_OVER",
        message:
          "Sie wurden abgemeldet, weil eine andere Person die Bearbeitung dieser Organisationseinheit übernommen hat.",
      });
    }

    return res.json({
      ok: true,
      team: req.session.team,
      lock: {
        ownsLock: true,
        expiresAt: lock.expiresAt,
        remainingMs: getRemainingMs(lock.expiresAt),
      },
      sessionTimeoutMs: SESSION_TIMEOUT_MS,
      warningBeforeTimeoutMs: SESSION_WARNING_MS,
    });
  } catch (error) {
    console.error("Fehler beim Prüfen des Lock-Status:", error);
    return res.status(500).json({
      ok: false,
      message: "Lock-Status konnte nicht geprüft werden",
    });
  }
});

// Get active team tree
router.get("/teams", async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({
      ok: false,
      message: "Nicht eingeloggt",
    });
  }

  try {
    const teams = await prisma.team.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return res.json({
      ok: true,
      teams: buildTree(teams),
    });
  } catch (error) {
    console.error("Fehler beim Laden der Teamstruktur:", error);
    return res.status(500).json({
      ok: false,
      message: "Teamstruktur konnte nicht geladen werden",
    });
  }
});

// Get selectable teams
router.get("/selectable-teams", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        AND: {
          isActive: true,
          isSelectable: true,
        },
      },
      include: {
        parent: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    if (!teams) return res.status(500).json({
      ok: false,
      message: "Teamstruktur konnte nicht geladen werden",
    });

    if (req.session.authenticated && req.session.teamId !== 57) teams.splice(teams.findIndex(team => team.name === "Administration"), 1);

    let formattedTeams = teams.map((node) => ({
      id: node.id,
      name: node.name,
      parentId: node.parentId,
      isSelectable: node.isSelectable,
      isActive: node.isActive,
      childrenLevelsAllowed: node.childrenLevelsAllowed,
      formattedName: node.childrenLevelsAllowed === "ZERO" && node.parent ? `${node.parent.name} | ${node.name}` : node.name,
    }));

    return res.json({
      ok: true,
      teams: formattedTeams,
    });
  } catch (error) {
    console.error("Fehler beim Laden der Teamstruktur:", error);
    return res.status(500).json({
      ok: false,
      message: "Teamstruktur konnte nicht geladen werden",
    });
  }
});

// Save selected team and acquire team lock
router.post("/team", async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({
      ok: false,
      message: "Nicht eingeloggt",
    });
  }

  const { team, forceTakeover = false } = req.body;

  if (!team) {
    return res.status(400).json({
      ok: false,
      message: "Kein Team ausgewählt",
    });
  }

  try {
    const dbTeam = await prisma.team.findUnique({
      where: { name: team },
    });

    if (!dbTeam || !dbTeam.isActive) {
      return res.status(404).json({
        ok: false,
        message: "Team nicht gefunden",
      });
    }

    if (!dbTeam.isSelectable) {
      return res.status(400).json({
        ok: false,
        message:
          "Diese Organisationseinheit kann derzeit nicht ausgewählt werden",
      });
    }

    if (req.session.teamId !== 57 || team === "Administration") await releaseSessionLocks(req.session.id, dbTeam.id);

    let lock;

    if (forceTakeover) {
      lock = await takeOverTeamLock(dbTeam.id, req.session.id);
    } else {
      lock = await acquireTeamLock(dbTeam.id, req.session.id);
    }

    if (req.session.teamId !== 57 || team === "Administration") {
      req.session.team = dbTeam.name;
      req.session.teamId = dbTeam.id;
    }

    await prisma.teamLoginEvent.create({
      data: {
        teamId: dbTeam.id,
        sessionId: req.session.id,
        loggedInAt: new Date(),
      },
    });

    return res.json({
      ok: true,
      authenticated: true,
      team: req.session.team,
      teamId: req.session.teamId,
      lock: {
        ownsLock: true,
        expiresAt: lock.expiresAt,
        remainingMs: getRemainingMs(lock.expiresAt),
      },
      sessionTimeoutMs: SESSION_TIMEOUT_MS,
      warningBeforeTimeoutMs: SESSION_WARNING_MS,
      sessionTakenOver: !!forceTakeover,
    });
  } catch (error) {
    // IMPORTANT: REMOVE SECOND CONDITION AFTER FINISHING ADMIN DEVELOPMENT
    if (error.code === "TEAM_LOCKED" || error.code === "ADMIN_LOCKED") {
      return res.status(423).json({
        ok: false,
        code: "TEAM_LOCKED",
        allowTakeover: false,
        team: team,
        message:
          "Diese Organisationseinheit wird derzeit bereits in einer anderen aktiven Sitzung bearbeitet.",
        takeoverMessage:
          "Möchten Sie die aktive Bearbeitung übernehmen? Die andere Person wird dann automatisch abgemeldet.",
      });
    }

    if (error.code === "ADMIN_LOCKED") {
      return res.status(423).json({
        ok: false,
        code: "ADMIN_LOCKED",
        allowTakeover: false,
        team: team,
        message:
          "Diese Organisationseinheit wird derzeit von der Administration bearbeitet. Ein Zugriff ist derzeit nicht möglich.",
      });
    }

    console.error("Fehler beim Laden des Teams:", error);
    return res.status(500).json({
      ok: false,
      message: "Team konnte nicht gespeichert werden",
    });
  }
});

// Keep session and team lock alive
router.post("/keepalive", async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({
      ok: false,
      code: "NOT_AUTHENTICATED",
      message: "Nicht eingeloggt",
    });
  }

  if (!req.session.team || !req.session.teamId) {
    return res.status(403).json({
      ok: false,
      code: "NO_TEAM_SELECTED",
      message: "Kein Team ausgewählt",
    });
  }

  try {
    const lock = await refreshLock(req.session.teamId, req.session.id);
    req.session.touch();

    return res.json({
      ok: true,
      team: req.session.team,
      sessionTimeoutMs: SESSION_TIMEOUT_MS,
      warningBeforeTimeoutMs: SESSION_WARNING_MS,
      lock: {
        ownsLock: true,
        expiresAt: lock.expiresAt,
        remainingMs: getRemainingMs(lock.expiresAt),
      },
    });
  } catch (error) {
    if (error.code === "TEAM_LOCK_MISSING") {
      return res.status(423).json({
        ok: false,
        code: "TEAM_LOCK_EXPIRED",
        message:
          "Die Bearbeitungssitzung für diese Organisationseinheit ist abgelaufen. Bitte melden Sie sich erneut an.",
      });
    }

    if (error.code === "TEAM_LOCK_TAKEN_OVER") {
      return res.status(423).json({
        ok: false,
        code: "TEAM_LOCK_TAKEN_OVER",
        message:
          "Sie wurden abgemeldet, weil eine andere Person die Bearbeitung dieser Organisationseinheit übernommen hat.",
      });
    }

    console.error("Fehler beim Keepalive:", error);
    return res.status(500).json({
      ok: false,
      message: "Sitzung konnte nicht verlängert werden",
    });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    await releaseSessionLocks(req.session.id);
    await deleteTeamView(req.session.teamId);
  } catch (error) {
    console.error("Fehler beim Freigeben der Team-Sperre beim Logout:", error);
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        message: "Logout fehlgeschlagen",
      });
    }

    res.clearCookie("questionnaire.sid");

    return res.json({
      ok: true,
    });
  });
});

router.delete("/logout-team-view", async (req, res) => {
  try {
    const teamViewRecord = await prisma.teamView.findUnique({
      where: { sessionTeamId: req.session.teamId }
    });
    if (!teamViewRecord) return res.json({ ok: true })

    const deleteSessionLock = await prisma.teamSessionLock.delete({
      where: {
        teamId: teamViewRecord.viewingTeamId,
      }
    })

    return res.json({ ok: true })
  } catch (error) {
    console.error("Fehler beim Freigeben der Team-Sperre beim Logout:", error);
  }
});

module.exports = router;