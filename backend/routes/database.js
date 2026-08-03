const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const bcrypt = require('bcrypt');
const saltRounds = 10;

function determineAllowedChildren(parent) {
    if (parent) {
        if (parent.childrenLevelsAllowed === "ONE") return "ZERO"
        else return "ONE"
    } else return "TWO"
};

async function deleteSingleTeam(id) {
    const deleteTeam = await prisma.team.delete({
        where: {
            id: id
        },
    });
};

async function updateParentSelectable(id) {
    const updateParent = await prisma.team.update({
        where: { id: id },
        data: { isSelectable: true }
    });
};

async function updateParentUnselectable(id) {
    const updateParent = await prisma.team.update({
        where: { id: id },
        data: { isSelectable: false }
    });

    const deleteSurveyRuns = prisma.surveyRun.deleteMany({
        where: { teamId: id }
    });

    const deleteSurveySnapshots = prisma.surveySnapshot.deleteMany({
        where: { teamId: id }
    });

    const deleteTeamCurrentState = prisma.teamCurrentState.deleteMany({
        where: { teamId: id }
    });

    const deleteTeamSettings = prisma.teamSettings.deleteMany({
        where: { teamId: id }
    });

    const transaction = await prisma.$transaction([deleteSurveyRuns, deleteSurveySnapshots, deleteTeamCurrentState, deleteTeamSettings]);
};

async function generatePasswordHash(plaintextPassword) {
    const passwordHash = await bcrypt.hash(plaintextPassword, saltRounds);
    return passwordHash
}

router.post("/create-team", async (req, res) => {
    const sessionTeamId = req.session.teamId;
    const authenticated = req.session.authenticated;
    try {
        if (sessionTeamId === 57 && authenticated) {
            const teamName = req.body.teamName;
            const parentElementId = req.body.parentElementId;
            const password = req.body.password;
            const parentElement = parentElementId ? await prisma.team.findUnique({
                where: { id: parentElementId },
                include: {
                    children: true
                }
            }) : null;

            const elementWithTeamName = await prisma.team.findUnique({
                where: { name: teamName }
            });

            if (elementWithTeamName)
                return res.status(409).json({ ok: false, message: "Der eingegebene Name existiert bereits." });

            if ((parentElementId && !parentElement) || (parentElement && parentElement.name === "Administration"))
                return res.status(404).json({ ok: false, message: "Das Elternelement wurde nicht gefunden." });

            if (parentElement && parentElement.childrenLevelsAllowed === "ZERO")
                return res.status(409).json({ ok: false, message: "Das Elternelement darf keine neue Ebene an Teams besitzen." });

            const childrenLevelsAllowed = determineAllowedChildren(parentElement);

            const passwordHash = await generatePasswordHash(password);

            const highestSortOrder = await prisma.team.aggregate({
                _max: {
                    sortOrder: true,
                },
            });

            const createdTeam = await prisma.team.create({
                data: {
                    name: teamName,
                    passwordHash: passwordHash,
                    parentId: parentElementId,
                    childrenLevelsAllowed: childrenLevelsAllowed,
                    isSelectable: true,
                    sortOrder: highestSortOrder._max.sortOrder + 1,
                    isActive: true,
                },
            });

            if (parentElement && parentElement.children.length === 0) await updateParentUnselectable(parentElement.id);

            return res.status(200).json({
                ok: true,
                message: `Das Team wurde erfolgreich erstellt.`,
                id: createdTeam.id,
            })
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

router.put("/update-team", async (req, res) => {
    const sessionTeamId = req.session.teamId;
    const authenticated = req.session.authenticated;
    try {
        if (sessionTeamId === 57 && authenticated) {
            const teamId = req.body.teamId;
            const teamName = req.body.teamName;
            const password = req.body.password;
            if (!teamId || !teamName)
                return res.status(409).json({ ok: false, message: "Bitte füllen Sie die Eingaben vollständig aus." });

            const teamRecord = await prisma.team.findUnique({
                where: { id: teamId },
                include: {
                    sessionLock: true,
                    children: true,
                }
            });

            if (teamRecord.sessionLock)
                return res.status(409).json({ ok: false, message: "Das ausgewählte Team ist aktuell eingeloggt." });

            if (!teamRecord || teamRecord.name === "Administration")
                return res.status(404).json({ ok: false, message: "Das Team wurde nicht gefunden." });

            const elementWithTeamName = await prisma.team.findUnique({
                where: { name: teamName }
            });

            if (elementWithTeamName && elementWithTeamName.id != teamId)
                return res.status(409).json({ ok: false, message: "Der eingegebene Name existiert bereits." });

            if (teamRecord.children.length === 0 && !password)
                return res.status(409).json({ ok: false, message: "Teams ohne Kinderelemente erfordern ein Passwort." });

            const passwordHash = teamRecord.isSelectable ? await generatePasswordHash(password) : null;

            const updateTeam = await prisma.team.update({
                where: { id: teamId },
                data: {
                    name: teamName,
                    passwordHash: passwordHash,
                },
            });

            return res.status(200).json({
                ok: true,
                message: `Das Team wurde erfolgreich verändert.`
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

router.delete("/delete-team", async (req, res) => {
    const sessionTeamId = req.session.teamId;
    const authenticated = req.session.authenticated;
    try {
        if (sessionTeamId === 57 && authenticated) {
            const teamId = req.body.teamId;
            const teamRecord = await prisma.team.findUnique({
                where: { id: teamId },
                include: {
                    children: {
                        include: {
                            children: true
                        }
                    },
                    sessionLock: true,
                }
            });

            if (teamRecord.sessionLock)
                return res.status(409).json({ ok: false, message: "Das ausgewählte Team ist aktuell eingeloggt." });

            if (!teamRecord || teamRecord.name === "Administration")
                return res.status(404).json({ ok: false, message: "Das Team wurde nicht gefunden." });

            const parentId = teamRecord.parentId

            for (const element of teamRecord.children) {
                if (element.children.length > 0) {
                    const deleteMultipleUsers = await prisma.team.deleteMany({
                        where: {
                            parentId: element.id
                        }
                    })
                }
                await deleteSingleTeam(element.id);
            };

            await deleteSingleTeam(teamId);

            const parentRecord = parentId ? await prisma.team.findUnique({
                where: { id: parentId },
                include: {
                    children: true
                }
            }) : null;

            if (parentRecord && parentRecord.children.length === 0) updateParentSelectable(parentId);

            return res.status(200).json({
                ok: true,
                message: `Das Team wurde erfolgreich gelöscht.`
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