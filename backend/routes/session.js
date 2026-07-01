const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const { Prisma } = require("@prisma/client");

const SESSION_TIMEOUT_MS =
  Number(process.env.SESSION_TIMEOUT_MS) || 1000 * 60 * 60 * 24 * 365 * 10;

function getLockExpiryDate() {
  return new Date(Date.now() + SESSION_TIMEOUT_MS);
}

async function releaseExpiredLocks() {
  return;
}

function requireAuth(req, res, next) {
  if (!req.session.authenticated) {
    return res.status(401).json({
      ok: false,
      message: "Nicht eingeloggt",
    });
  }

  if (!req.session.team || !req.session.teamId) {
    return res.status(403).json({
      ok: false,
      message: "Kein Team ausgewählt",
    });
  }

  next();
}

async function requireActiveTeamLock(req, res, next) {
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
          "Die Bearbeitungssitzung für diese Organisationseinheit ist abgelaufen. Bitte melden Sie sich erneut an.",
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

    await prisma.teamSessionLock.update({
      where: { teamId: req.session.teamId },
      data: {
        lastActivityAt: new Date(),
        expiresAt: getLockExpiryDate(),
      },
    });

    req.session.touch();
    next();
  } catch (error) {
    console.error("Fehler bei der Prüfung der Team-Sperre:", error);
    return res.status(500).json({
      ok: false,
      message: "Team-Sperre konnte nicht geprüft werden",
    });
  }
}

router.post("/results", requireAuth, requireActiveTeamLock, async (req, res) => {
  const viewTeam = await retrieveTeamView(req.session.teamId)
  const teamId = viewTeam && req.session.teamId === 57 ? viewTeam.id : req.session.teamId
  const teamName = viewTeam && req.session.teamId === 57 ? viewTeam.name : req.session.team
  try {
    const submittedAt = req.body.timestamp
      ? new Date(req.body.timestamp)
      : new Date();

    const snapshotType =
      req.body.snapshotType === "dimension_complete" ||
        req.body.snapshotType === "team_complete"
        ? req.body.snapshotType
        : null;

    const payloadWithMeta = {
      ...req.body,
      team: teamName,
      teamId: teamId,
      savedAt: new Date().toISOString(),
    };

    await prisma.surveyRun.updateMany({
      where: {
        teamId: teamId,
        isLatest: true,
      },
      data: {
        isLatest: false,
      },
    });

    const createdRun = await prisma.surveyRun.create({
      data: {
        teamId: teamId,
        submittedAt,
        dimensionId: req.body.dimensionId || null,
        handlungsfeldId: req.body.handlungsfeldId || null,
        payload: payloadWithMeta,
        isLatest: true,
      },
    });

    if (snapshotType) {
      await prisma.surveySnapshot.create({
        data: {
          teamId: teamId,
          snapshotType,
          dimensionId: req.body.dimensionId || null,
          handlungsfeldId: req.body.handlungsfeldId || null,
          submittedAt,
          payload: payloadWithMeta,
        },
      });
    }

    await prisma.teamCurrentState.upsert({
      where: {
        teamId: teamId,
      },
      update: {
        latestSurveyRunId: createdRun.id,
      },
      create: {
        teamId: teamId,
        latestSurveyRunId: createdRun.id,
        currentAnswers: null,
      },
    });

    return res.json({
      ok: true,
      team: teamId,
      surveyRunId: createdRun.id,
      snapshotStored: !!snapshotType,
      snapshotType,
    });
  } catch (error) {
    console.error("Fehler beim Speichern der Ergebnisse:", error);
    return res.status(500).json({
      ok: false,
      message: "Ergebnisse konnten nicht gespeichert werden",
    });
  }
});

router.get("/results", requireAuth, async (req, res) => {
  const viewTeam = await retrieveTeamView(req.session.teamId)
  const teamId = viewTeam ? viewTeam.id : req.session.teamId
  const teamName = viewTeam ? viewTeam.name : req.session.team
  try {
    const latestRun = await prisma.surveyRun.findFirst({
      where: {
        teamId: teamId,
        isLatest: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return res.json({
      sessionId: teamId,
      team: teamName,
      results: latestRun ? [latestRun.payload] : [],
    });
  } catch (error) {
    console.error("Fehler beim Laden der Ergebnisse:", error);
    return res.status(500).json({
      ok: false,
      message: "Ergebnisse konnten nicht geladen werden",
    });
  }
});

router.get("/settings", requireAuth, async (req, res) => {
  const viewTeam = await retrieveTeamView(req.session.teamId)
  const teamId = viewTeam ? viewTeam.id : req.session.teamId
  const teamName = viewTeam ? viewTeam.name : req.session.team

  try {
    const settings = await prisma.teamSettings.findUnique({
      where: { teamId: teamId },
    });

    return res.json({
      ok: true,
      team: teamName,
      privilegedAccess: req.session.teamId === 57 ? true : false,
      activeDimensions: Array.isArray(settings?.activeDimensions)
        ? settings.activeDimensions
        : [],
      lockedDimensions: Array.isArray(settings?.lockedDimensions)
        ? settings.lockedDimensions
        : [],
    });
  } catch (error) {
    console.error("Fehler beim Laden der Einstellungen:", error);
    return res.status(500).json({
      ok: false,
      message: "Einstellungen konnten nicht geladen werden",
    });
  }
});

router.post("/settings", requireAuth, requireActiveTeamLock, async (req, res) => {
  const viewTeam = await retrieveTeamView(req.session.teamId)
  const teamId = viewTeam && req.session.teamId === 57 ? viewTeam.id : req.session.teamId
  const teamName = viewTeam && req.session.teamId === 57 ? viewTeam.name : req.session.team
  try {
    const activeDimensions = Array.isArray(req.body.activeDimensions)
      ? req.body.activeDimensions
      : [];

    const savedSettings = await prisma.teamSettings.upsert({
      where: { teamId: teamId },
      update: { activeDimensions },
      create: {
        teamId: teamId,
        activeDimensions,
      },
    });

    return res.json({
      ok: true,
      team: teamName,
      activeDimensions: savedSettings.activeDimensions,
    });
  } catch (error) {
    console.error("Fehler beim Speichern der Einstellungen:", error);
    return res.status(500).json({
      ok: false,
      message: "Einstellungen konnten nicht gespeichert werden",
    });
  }
});

router.post("/locking-dimension", requireAuth, async (req, res) => {
  if (req.session.teamId !== 57) return res.status(403).json({
    ok: false,
    message: "Eingeloggter Nutzer besitzt nicht die notwendigen Rechte"
  })
  try {
    const dimensionId = req.body.dimensionId;
    const lockStatus = req.body.lockStatus;
    const teamViewRecord = await prisma.teamView.findUnique({
      where: { sessionTeamId: req.session.teamId }
    });
    const viewTeamId = teamViewRecord.viewingTeamId;
    const settings = await prisma.teamSettings.findUnique({
      where: { teamId: viewTeamId }
    });
    let lockedDimensionsObject = settings?.lockedDimensions
    if (lockedDimensionsObject && lockStatus) lockedDimensionsObject.push(dimensionId)
    else if (lockedDimensionsObject && !lockStatus) {
      let index = lockedDimensionsObject.indexOf(dimensionId)
      if (index > -1){
        lockedDimensionsObject.splice(index, 1)
      }
    }
    const changeLock = await prisma.teamSettings.update({
      where: { teamId: viewTeamId },
      data: { lockedDimensions: lockedDimensionsObject ? lockedDimensionsObject : [dimensionId] },
    });
    return res.status(200).json({
      ok:true,
      lockedDimensions: lockedDimensionsObject,
    })
  } catch (error) {
    console.error("Fehler beim Speichern des Zustands:", error);
    return res.status(500).json({
      ok: false,
      message: "Zustand des Pakets konnte nicht gespeichert werden.",
    });
  }
})

router.get("/current-state", requireAuth, async (req, res) => {
  let viewTeam = await retrieveTeamView(req.session.teamId)
  const teamId = viewTeam ? viewTeam.id : req.session.teamId
  const teamName = viewTeam ? viewTeam.name : req.session.team
  try {
    const currentState = await prisma.teamCurrentState.findUnique({
      where: { teamId: teamId },
    });
    return res.json({
      ok: true,
      team: teamName,
      privilegedAccess: req.session.teamId === 57 ? true : false,
      currentAnswers:
        currentState?.currentAnswers &&
          typeof currentState.currentAnswers === "object"
          ? currentState.currentAnswers
          : {},
    });
  } catch (error) {
    console.error("Fehler beim Laden des aktuellen Zustands:", error);
    return res.status(500).json({
      ok: false,
      message: "Aktueller Zustand konnte nicht geladen werden",
    });
  }
});

router.post(
  "/current-state",
  requireAuth,
  requireActiveTeamLock,
  async (req, res) => {
    const viewTeam = await retrieveTeamView(req.session.teamId)
    const teamId = viewTeam && req.session.teamId === 57 ? viewTeam.id : req.session.teamId
    const teamName = viewTeam && req.session.teamId === 57 ? viewTeam.name : req.session.team
    try {
      const currentAnswers =
        req.body.currentAnswers && typeof req.body.currentAnswers === "object"
          ? req.body.currentAnswers
          : {};

      const savedState = await prisma.teamCurrentState.upsert({
        where: { teamId: teamId },
        update: { currentAnswers },
        create: {
          teamId: teamId,
          currentAnswers,
          latestSurveyRunId: null,
        },
      });

      return res.json({
        ok: true,
        team: teamName,
        currentAnswers: savedState.currentAnswers || {},
      });
    } catch (error) {
      console.error("Fehler beim Speichern des aktuellen Zustands:", error);
      return res.status(500).json({
        ok: false,
        message: "Aktueller Zustand konnte nicht gespeichert werden",
      });
    }
  }
);

router.get("/research-summary", requireAuth, async (req, res) => {
  try {
    const [loginCount, dimensionSnapshots, teamSnapshots] = await Promise.all([
      prisma.teamLoginEvent.count({
        where: { teamId: req.session.teamId },
      }),
      prisma.surveySnapshot.count({
        where: {
          teamId: req.session.teamId,
          snapshotType: "dimension_complete",
        },
      }),
      prisma.surveySnapshot.count({
        where: {
          teamId: req.session.teamId,
          snapshotType: "team_complete",
        },
      }),
    ]);

    return res.json({
      ok: true,
      team: req.session.team,
      loginCount,
      dimensionSnapshots,
      teamSnapshots,
    });
  } catch (error) {
    console.error("Fehler beim Laden der Research-Zusammenfassung:", error);
    return res.status(500).json({
      ok: false,
      message: "Research-Zusammenfassung konnte nicht geladen werden",
    });
  }
});

router.get("/selected-user", requireAuth, async (req, res) => {
  const teamId = req.session.teamId
  try {
    const teamRecord = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!teamRecord) return res.status(404).json({ message: "Team nicht gefunden" });

    const tempView = await prisma.teamView.findUnique({
      where: { sessionTeamId: req.session.teamId },
      include: {
        viewTeam: true,
      },
    })
    const teamName = tempView ? tempView.viewTeam.name : teamRecord.name
    res.status(200).json({ message: "Nutzer wurde geladen.", teamName: teamName })
  } catch (error) {
    console.error("Fehler:", error)
  }
});

router.post("/temporary-view", requireAuth, async (req, res) => {
  const viewTeamId = Number(req.body.viewTeamId)
  try {
    const teamRecord = await prisma.team.findUnique({
      where: { id: req.session.teamId }
    });
    const viewTeamRecord = await prisma.team.findUnique({
      where: { id: viewTeamId }
    });

    if (!teamRecord || !viewTeamRecord) return res.status(404).json({ message: "Team nicht gefunden" });

    if (req.session.teamId === 57 || teamRecord.parentId === viewTeamRecord.parentId) {
      const tempView = await prisma.teamView.upsert({
        where: { sessionTeamId: req.session.teamId },
        update: { viewingTeamId: viewTeamId },
        create: {
          sessionTeamId: req.session.teamId,
          viewingTeamId: viewTeamId,
        }
      })
      res.status(200).json({ message: "Temporäre Einsicht wurde erstellt." })
    } else {
      res.status(401).json({ message: "Zugriff auf das Team ist nicht erlaubt." })
    }
  } catch (error) {
    console.error("Fehler:", error)
  }
});

router.delete("/temporary-view", requireAuth, async (req, res) => {
  try {
    const existingTeamView = await prisma.teamView.findUnique({
      where: { sessionTeamId: req.session.teamId }
    })

    if (!existingTeamView) return res.status(200).json({ message: "Es wurde kein Eintrag gefunden" })

    const teamRecord = await prisma.team.findUnique({
      where: { id: req.session.teamId }
    });
    const viewTeamRecord = await prisma.team.findUnique({
      where: { id: existingTeamView.viewingTeamId }
    });

    if (!teamRecord || !viewTeamRecord) return res.status(404).json({ message: "Team wurde nicht gefunden." });

    if (req.session.teamId === 57 || teamRecord.parentId === viewTeamRecord.parentId) {
      const deleteTeamView = await prisma.teamView.delete({
        where: {
          sessionTeamId: req.session.teamId,
        }
      })
      res.status(200).json({ message: "Team wurde erfolgreich gelöscht." })
    } else {
      res.status(401).json({ message: "Zugriff auf das Team ist nicht erlaubt." })
    }
  } catch (error) {
    console.error("Fehler:", error)
  }
});

async function retrieveTeamView(teamId) {
  try {
    const teamViewRecord = await prisma.teamView.findUnique({
      where: { sessionTeamId: teamId }
    });
    if (!teamViewRecord) return null
    const teamRecord = await prisma.team.findUnique({
      where: { id: teamId }
    });
    const viewTeamRecord = await prisma.team.findUnique({
      where: { id: teamViewRecord.viewingTeamId }
    });
    if (teamId === 57 || teamRecord.parentId === viewTeamRecord.parentId) return viewTeamRecord;
    else throw new Error("Unbefugter Zugriff auf das Team!");
  } catch (error) {
    console.error("Fehler:", error)
  }
}

module.exports = router;