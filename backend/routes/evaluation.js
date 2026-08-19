const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const structure = require("../../frontend/src/components/data/struktur.json");
const { EvaluationName } = require("../validation/schemas.ts");

function getLowestSelectableTeams(teams) {
    const selectableParentIds = new Set(
        teams.map(team => team.parentId).filter(Number.isInteger)
    );
    return teams.filter(team => !selectableParentIds.has(team.id));
}

function getTeamUnitId(teamName) {
    return teamName.toLowerCase().replace(/\s/g, "-");
}

function determineOrganisation(team) {
    const teamIdName = team.name.toLowerCase().replace(/\s/g, "-");
    let organisationBody = {};

    if (!team.parent || !team.parent.parentId) {
        organisationBody = {
            id: teamIdName,
            name: team.name,
            children: []
        }
        return organisationBody;
    } else {
        const parentId = team.parent.name.toLowerCase().replace(/\s/g, "-");
        organisationBody = {
            id: parentId,
            name: team.parent.name,
            children: [
                {
                    id: teamIdName,
                    name: team.name
                }
            ]
        };
        return organisationBody;
    }
};

function determinePackages(obj, includedPackages) {
    let allPackages = [];
    let packagesBody = {};
    obj.payload.results.forEach((obj) => {
        let existingPackage = allPackages.length > 0 ? allPackages.find(pack => pack.name === obj.group) : null;
        if (!includedPackages.includes(obj.group.toLowerCase())) {
            if (existingPackage) {
                if (!existingPackage.fields.includes(obj.category)) existingPackage.fields.push(obj.category);
            } else {
                packagesBody = {
                    id: obj.group.toLowerCase(),
                    name: obj.group,
                    fields: [obj.category],
                };
                allPackages.push(packagesBody);
            }
        }
    })
    return allPackages;
};

function determineLeafresults(obj, surveySnapshotData) {
    const teamId = obj.teamId;
    const unitId = getTeamUnitId(obj.team.name);
    const importer = `Import ${obj.team.name}`;
    let values = {};
    let completedPackages = [];
    let leafResultsBody = {};

    obj.payload.results.forEach((dimensionObj) => {
        const group = dimensionObj.group.toLowerCase();
        const category = dimensionObj.category;
        const value = dimensionObj.value;
        if (Object.hasOwn(values, group)) values[group][category] = value;
        else {
            values[group] = { [category]: value }
            if (obj.payload.snapshotType === "team_complete") completedPackages.push(group.toLowerCase())
        }
    })

    if (obj.payload.snapshotType !== "team_complete") {
        const finishedDimensions = surveySnapshotData
            .filter(surveyObj => surveyObj.teamId === teamId)
            .map(({ dimensionId }) => dimensionId)
        finishedDimensions?.forEach(dimensionId => {
            const dimensionName = structure.dimensionen.find((obj) => obj.id === dimensionId).name
            completedPackages.push(dimensionName.toLowerCase())
        })
    }

    leafResultsBody = {
        unitId: unitId,
        importer: importer,
        hasAnsweredQuestions:
            Array.isArray(obj.payload.selections) && obj.payload.selections.length > 0,
        completedPackageIds: completedPackages,
        values: values,
    };

    return leafResultsBody;
};

async function getAllEvaluations() {
    const evaluations = await prisma.evaluationRounds.findMany()
    evaluations.forEach(obj => {
        const createDate = obj.createdAt;
        const updateDate = obj.updatedAt;
        obj.createdAt = new Date(createDate).toLocaleDateString("de-DE")
        obj.updatedAt = new Date(updateDate).toLocaleDateString("de-DE")
    });
    return evaluations
};

async function createEvaluationRoundData() {
    let finalData = {
        id: 0,
        name: "",
        packages: [],
        organisation: [],
        leafResults: [],
        teamCounts: {
            completed: 0,
            total: 0,
        },
    }
    let includedPackages = [];

    try {
        const [surveyRunData, surveySnapshotData, organisationTeamData] = await Promise.all([
            prisma.surveyRun.findMany({
                where: {
                    isLatest: true,
                    teamId: { not: 57 },
                },
                include: {
                    team: {
                        include: {
                            parent: true
                        }
                    }
                },
            }),
            prisma.surveySnapshot.findMany({
                where: {
                    snapshotType: "dimension_complete"
                }, include: {
                    team: true
                },
            }),
            prisma.team.findMany({
                where: {
                    isActive: true,
                    isSelectable: true,
                    id: { not: 57 },
                },
                include: {
                    parent: true,
                    current: true,
                },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            }),
        ]);

        if (!surveyRunData || !surveySnapshotData) return res.status(404).json({
            ok: false,
            message: "Es konnten keine Evaluations Runden gefunden werden.",
        });

        organisationTeamData.forEach((team) => {
            const organisationResult = determineOrganisation(team);
            const existingOrganisation = finalData.organisation.find(org => org.id === organisationResult.id);
            if (existingOrganisation) existingOrganisation.children.push(...organisationResult.children)
            else finalData.organisation.push(organisationResult);
        });

        const lowestSelectableTeams = getLowestSelectableTeams(organisationTeamData);
        const eligibleTeamIds = new Set(lowestSelectableTeams.map(team => team.id));
        const completedTeamIds = new Set();

        surveyRunData.forEach((obj) => {
            const packagesResult = determinePackages(obj, includedPackages);
            includedPackages.push(...packagesResult.map(({ id }) => id))
            finalData.packages.push(...packagesResult);

            const leafResults = determineLeafresults(obj, surveySnapshotData);
            finalData.leafResults.push(leafResults);
            if (
                eligibleTeamIds.has(obj.teamId) &&
                leafResults.completedPackageIds.length > 0
            ) {
                completedTeamIds.add(obj.teamId);
            }
        });

        finalData.teamCounts = {
            completed: completedTeamIds.size,
            total: lowestSelectableTeams.length,
        };

        return finalData
    } catch (error) {
        console.log(error)
    }
};

async function deletePreviousAnswers() {
    const deleteSurveyRuns = prisma.surveyRun.deleteMany({});

    const deleteSurveySnapshots = prisma.surveySnapshot.deleteMany({});

    const deleteTeamCurrentState = prisma.teamCurrentState.deleteMany({});

    const transaction = await prisma.$transaction([deleteSurveyRuns, deleteSurveySnapshots, deleteTeamCurrentState]);
}

router.get("/", async (req, res) => {
    try {
        const evaluationRounds = await getAllEvaluations();
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
            const result = EvaluationName.safeParse({ name: req.body.evaluationName });
            if (!result.success) return res.status(400).json({
                ok: false,
                message: "Die Eingaben konnten nicht verarbeitet werden.",
            });

            const evaluationName = result.data.name;

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

                let data = await createEvaluationRoundData()
                data.id = previousActiveEvaluation.id;
                data.name = previousActiveEvaluation.name;

                await prisma.evaluationRoundsData.create({
                    data: {
                        evaluationRound: previousActiveEvaluation.id,
                        payload: data,
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
            await deletePreviousAnswers()

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
            
            const result = EvaluationName.safeParse({ name: req.body.evaluationName });
            if (!result.success) return res.status(400).json({
                ok: false,
                message: "Die Eingaben konnten nicht verarbeitet werden.",
            });
            const name = result.data.name;
            
            const evaluationRound = await prisma.evaluationRounds.findUnique({
                where: {
                    id: id
                },
            });

            if (evaluationRound) {
                await prisma.evaluationRounds.update({
                    where: {
                        id: id,
                    },
                    data: {
                        name: name,
                    },
                });
                if (!evaluationRound.isActive) {
                    const evaluationRoundData = await prisma.evaluationRoundsData.findUnique({
                        where: {
                            evaluationRound: evaluationRound.id
                        }
                    });
                    if (!evaluationRoundData) return res.status(404).json({
                        ok: false,
                        message: "Die Daten der Evaluationsrunde konnten nicht gefunden werden."
                    });

                    const updatedPayload = { ...evaluationRoundData.payload, name: name }

                    await prisma.evaluationRoundsData.update({
                        where: {
                            id: evaluationRoundData.id
                        },
                        data: {
                            payload: updatedPayload,
                        }
                    })
                }
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

            if (evaluationRound) {
                if (evaluationRound.isActive) return res.status(409).json({
                    ok: false,
                    message: "Aktive Evaluationsrunden dürfen nicht gelöscht werden."
                });
                else {
                    const updateUser = await prisma.evaluationRounds.delete({
                        where: {
                            id: id,
                        },
                    });
                }
            } else return res.status(404).json({
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

router.get("/retrieve-data", async (req, res) => {
    if (!req.query.id) return res.status(404).json({
        ok: false,
        message: "Die Evaluations Runde konnte nicht gefunden werden."
    });
    const evaluationId = parseInt(req.query.id);
    if (isNaN(evaluationId)) return res.status(404).json({
        ok: false,
        message: "Die Evaluations Runde konnte nicht gefunden werden."
    });
    try {
        const [evaluationRound, selectableTeams] = await Promise.all([
            prisma.evaluationRounds.findUnique({
                where: {
                    id: evaluationId,
                },
                include: {
                    evaluationRoundData: true,
                },
            }),
            prisma.team.findMany({
                where: {
                    isActive: true,
                    isSelectable: true,
                    id: { not: 57 },
                },
                select: {
                    id: true,
                    parentId: true,
                    name: true,
                },
            }),
        ])

        if (!evaluationRound) return res.status(404).json({
            ok: false,
            message: "Die Evaluations Runde konnte nicht gefunden werden."
        });

        let data = null;

        if (evaluationRound.isActive) {
            data = await createEvaluationRoundData()
            data.id = evaluationRound.id;
            data.name = evaluationRound.name;
        } else {
            if (evaluationRound.evaluationRoundData.length === 0) return res.status(404).json({
                ok: false,
                message: "Die Daten der Evaluations Runde konnten nicht gefunden werden."
            });
            const [evaluationRoundData] = evaluationRound.evaluationRoundData
            data = evaluationRoundData.payload;
        }

        const lowestSelectableTeams = getLowestSelectableTeams(selectableTeams);
        const selectableLeafUnitIds = new Set(
            lowestSelectableTeams.map(team => getTeamUnitId(team.name))
        );
        const completedTeamCount = new Set(
            (data.leafResults || [])
                .filter(result =>
                    selectableLeafUnitIds.has(result.unitId) &&
                    Array.isArray(result.completedPackageIds) &&
                    result.completedPackageIds.length > 0
                )
                .map(result => result.unitId)
        ).size;

        data.teamCounts = {
            ...(data.teamCounts || {}),
            completed: completedTeamCount,
            total: lowestSelectableTeams.length,
        };

        return res.status(200).json({
            ok: true,
            message: "Evaluations Daten erfolgreich geladen.",
            data: data,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            message: `Ein Fehler im Server ist aufgetreten.`
        });
    }
});

module.exports = router;
