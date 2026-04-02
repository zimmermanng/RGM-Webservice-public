const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");

const SESSION_TIMEOUT_MS =
  Number(process.env.SESSION_TIMEOUT_MS) || 100000 * 60 * 60;

function getLockExpiryDate() {
  return new Date(Date.now() + SESSION_TIMEOUT_MS);
}

async function releaseExpiredLocks() {
  await prisma.teamSessionLock.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
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
      team: req.session.team,
      teamId: req.session.teamId,
      savedAt: new Date().toISOString(),
    };

    await prisma.surveyRun.updateMany({
      where: {
        teamId: req.session.teamId,
        isLatest: true,
      },
      data: {
        isLatest: false,
      },
    });

    const createdRun = await prisma.surveyRun.create({
      data: {
        teamId: req.session.teamId,
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
          teamId: req.session.teamId,
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
        teamId: req.session.teamId,
      },
      update: {
        latestSurveyRunId: createdRun.id,
      },
      create: {
        teamId: req.session.teamId,
        latestSurveyRunId: createdRun.id,
        currentAnswers: null,
      },
    });

    return res.json({
      ok: true,
      team: req.session.team,
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
  try {
    const latestRun = await prisma.surveyRun.findFirst({
      where: {
        teamId: req.session.teamId,
        isLatest: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return res.json({
      sessionId: req.session.id,
      team: req.session.team,
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
  try {
    const settings = await prisma.teamSettings.findUnique({
      where: { teamId: req.session.teamId },
    });

    return res.json({
      ok: true,
      team: req.session.team,
      activeDimensions: Array.isArray(settings?.activeDimensions)
        ? settings.activeDimensions
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
  try {
    const activeDimensions = Array.isArray(req.body.activeDimensions)
      ? req.body.activeDimensions
      : [];

    const savedSettings = await prisma.teamSettings.upsert({
      where: { teamId: req.session.teamId },
      update: { activeDimensions },
      create: {
        teamId: req.session.teamId,
        activeDimensions,
      },
    });

    return res.json({
      ok: true,
      team: req.session.team,
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

router.get("/current-state", requireAuth, async (req, res) => {
  try {
    const currentState = await prisma.teamCurrentState.findUnique({
      where: { teamId: req.session.teamId },
    });

    return res.json({
      ok: true,
      team: req.session.team,
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
    try {
      const currentAnswers =
        req.body.currentAnswers && typeof req.body.currentAnswers === "object"
          ? req.body.currentAnswers
          : {};

      const savedState = await prisma.teamCurrentState.upsert({
        where: { teamId: req.session.teamId },
        update: { currentAnswers },
        create: {
          teamId: req.session.teamId,
          currentAnswers,
          latestSurveyRunId: null,
        },
      });

      return res.json({
        ok: true,
        team: req.session.team,
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

module.exports = router;