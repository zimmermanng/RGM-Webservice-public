const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");

async function getAllEvaluations() {
    const evaluations = await prisma.evaluationRounds.findMany()
    evaluations.forEach(obj => {
        const createDate = obj.createdAt;
        const updateDate = obj.updatedAt;
        obj.createdAt = new Date(createDate).toLocaleDateString("de-DE")
        obj.updatedAt = new Date(updateDate).toLocaleDateString("de-DE")
    });
    return evaluations
}

router.get("/", async (req, res) => {
    try {
        const evaluationRounds = await getAllEvaluations()
        return res.status(200).json({
            ok: true,
            message: "Evaluations Runden erfolgreich geladen.",
            evaluationRounds: evaluationRounds,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            message: `Ein Fehler im Server ist aufgetreten.`
        });
    }
});

router.post("/create-evaluation", async (req, res) => {
    const sessionTeamId = req.session.teamId;
    const authenticated = req.session.authenticated;
    try {
        if (sessionTeamId === 57 && authenticated) {
            const evaluationName = req.body.evaluationName;
            const date = new Date(req.body.date);
            const previousActiveEvaluation = await prisma.evaluationRounds.findFirst({
                where: {
                    isActive: true
                },
            });
            if (previousActiveEvaluation) {
                await prisma.evaluationRounds.update({
                    where: {
                        id: previousActiveEvaluation.id
                    },
                    data: {
                        isActive: false
                    },
                });
            }

            const createEvaluation = await prisma.evaluationRounds.create({
                data: {
                    name: evaluationName,
                    isActive: true,
                    createdAt: date,
                    updatedAt: date,
                },
            });

            const evaluationRounds = await getAllEvaluations()

            return res.status(200).json({
                ok: true,
                message: "Evaluation erfolgreich hinzugefügt.",
                evaluationRounds: evaluationRounds,
            });
        } else return res.status(403).json({
            ok: false,
            message: `Sie sind für diese Aktion nicht berechtigt.`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            message: `Ein Fehler im Server ist aufgetreten.`
        });
    }
});

router.put("/change-name", async (req, res) => {
    const sessionTeamId = req.session.teamId;
    const authenticated = req.session.authenticated;
    try {
        if (sessionTeamId === 57 && authenticated) {
            const id = req.body.id;
            const name = req.body.evaluationName;
            const evaluationRound = await prisma.evaluationRounds.findUnique({
                where: {
                    id: id
                },
            });

            if (evaluationRound) {
                const updateUser = await prisma.evaluationRounds.update({
                    where: {
                        id: id,
                    },
                    data: {
                        name: name,
                    },
                });
            } else {
                return res.status(404).json({
                    ok: false,
                    message: "Die Evaluationsrunde konnte nicht gefunden werden."
                });
            }

            return res.status(200).json({
                ok: true,
                message: "Der Name wurde erfolgreich geändert."
            });
        } else return res.status(403).json({
            ok: false,
            message: `Sie sind für diese Aktion nicht berechtigt.`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            message: `Ein Fehler im Server ist aufgetreten.`
        });
    };
});

router.delete("/delete-evaluation", async (req, res) => {
    const sessionTeamId = req.session.teamId;
    const authenticated = req.session.authenticated;
    try {
        if (sessionTeamId === 57 && authenticated) {
            const id = req.body.id;
            const evaluationRound = await prisma.evaluationRounds.findUnique({
                where: {
                    id: id
                },
            });

            if (evaluationRound && evaluationRound.isActive)
                return res.status(409).json({
                    ok: false,
                    message: "Aktive Evaluationsrunden dürfen nicht gelöscht werden."
                });
            if (evaluationRound) {
                const updateUser = await prisma.evaluationRounds.delete({
                    where: {
                        id: id,
                    },
                });
            } else
                return res.status(404).json({
                    ok: false,
                    message: "Die Evaluationsrunde konnte nicht gefunden werden."
                });

            const evaluationRounds = await getAllEvaluations()

            return res.status(200).json({
                ok: true,
                message: "Evaluationsrunde erfolgreich gelöscht.",
                evaluationRounds: evaluationRounds,
            });
        } else return res.status(403).json({
            ok: false,
            message: `Sie sind für diese Aktion nicht berechtigt.`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            message: `Ein Fehler im Server ist aufgetreten.`
        });
    };
});

module.exports = router;