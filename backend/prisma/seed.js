const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");

const saltRounds = 10;
const APP_PASSWORD = process.env.APP_PASSWORD;

const ADMIN = {
  name: "Administration",
  isSelectable: true,
  childrenLevelsAllowed: "ZERO",
  sortOrder: 999,
}

const TEAM_TREE = {
  name: "Direktion",
  isSelectable: false,
  childrenLevelsAllowed: "TWO",
  sortOrder: 1,
  children: [
    {
      name: "Abteilung 1",
      isSelectable: false,
      childrenLevelsAllowed: "ONE",
      sortOrder: 10,
      children: [
        { name: "Referat 11", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 11 },
        { name: "Referat 12", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 12 },
        { name: "Referat 13", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 13 },
        { name: "Referat 14", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 14 },
      ],
    },
    {
      name: "Abteilung 2",
      isSelectable: false,
      childrenLevelsAllowed: "ONE",
      sortOrder: 20,
      children: [
        { name: "Referat 21", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 21 },
      ],
    },
    {
      name: "Abteilung 3",
      isSelectable: false,
      childrenLevelsAllowed: "ONE",
      sortOrder: 30,
      children: [
        { name: "Referat 31", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 31 },
        { name: "Referat 32", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 32 },
        { name: "Referat 33", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 33 },
      ],
    },
    {
      name: "Abteilung 4",
      isSelectable: false,
      childrenLevelsAllowed: "ONE",
      sortOrder: 40,
      children: [
        { name: "Referat 41", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 41 },
        { name: "Referat 42", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 42 },
        { name: "Referat 43", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 43 },
      ],
    },
    {
      name: "Querschnittsreferat Marketing / Öffentlichkeitsarbeit",
      isSelectable: true,
      childrenLevelsAllowed: "ONE",
      sortOrder: 50,
    },
    {
      name: "Querschnittsreferat IT / Administration",
      isSelectable: true,
      childrenLevelsAllowed: "ONE",
      sortOrder: 51,
    },
    {
      name: "Querschnittsreferat Verwaltung",
      isSelectable: false,
      childrenLevelsAllowed: "ONE",
      sortOrder: 52,
      children: [
        { name: "Personal", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 521 },
        { name: "Finanzen", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 522 },
        { name: "Juristik", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 523 },
        { name: "Arbeitsschutz", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 524 },
      ],
    },
    {
      name: "Stabsstelle Medienzentrenverbund",
      isSelectable: true,
      childrenLevelsAllowed: "ONE",
      sortOrder: 60,
    },
    {
      name: "Stabsstelle Projektmanagement",
      isSelectable: true,
      childrenLevelsAllowed: "ONE",
      sortOrder: 61,
    },
    {
      name: "Stabsstelle Zukunft des Lernens",
      isSelectable: true,
      childrenLevelsAllowed: "ONE",
      sortOrder: 62,
    },
    {
      name: "Stadtmedienzentrum Karlsruhe",
      isSelectable: true,
      childrenLevelsAllowed: "ONE",
      sortOrder: 70,
    },
    {
      name: "Stadtmedienzentrum Stuttgart",
      isSelectable: true,
      childrenLevelsAllowed: "ONE",
      sortOrder: 71,
    },
  ],
};

const MOCK_TEAM_TREE = {
  name: "Test0",
  isSelectable: false,
  sortOrder: 100,
  childrenLevelsAllowed: "TWO",
  children: [
    {
      name: "TestA",
      isSelectable: false,
      sortOrder: 101,
      childrenLevelsAllowed: "ONE",
      children: [
        { name: "TestA1", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 102 },
        { name: "TestA2", isSelectable: true, childrenLevelsAllowed: "ZERO", sortOrder: 103 },
      ],
    },
    {
      name: "TestB",
      isSelectable: true,
      sortOrder: 20,
      childrenLevelsAllowed: "ONE",
    },
  ],
}

async function createPasswordHash() {
  const passwordHash = await bcrypt.hash(APP_PASSWORD, saltRounds);
  return passwordHash;
}

async function upsertNode(node, parentId = null) {
  const passwordHash = await createPasswordHash();
  const saved = await prisma.team.upsert({
    where: { name: node.name },
    update: {
      parentId,
      passwordHash: node.isSelectable ? passwordHash : null,
      childrenLevelsAllowed: node.childrenLevelsAllowed,
      isSelectable: !!node.isSelectable,
      sortOrder: node.sortOrder ?? 0,
      isActive: node.isActive ?? true,
    },
    create: {
      name: node.name,
      passwordHash: node.isSelectable ? passwordHash : null,
      parentId,
      childrenLevelsAllowed: node.childrenLevelsAllowed,
      isSelectable: !!node.isSelectable,
      sortOrder: node.sortOrder ?? 0,
      isActive: node.isActive ?? true,
    },
  });

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      await upsertNode(child, saved.id);
    }
  }

  return saved;
}

async function main() {
  await upsertNode(TEAM_TREE);
  await upsertNode(ADMIN);
  // await upsertNode(MOCK_TEAM_TREE)
  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });