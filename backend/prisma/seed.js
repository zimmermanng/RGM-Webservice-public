require("dotenv").config({ path: __dirname + "/./../.env" });

const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");

const saltRounds = 10;
const APP_PASSWORD = process.env.APP_PASSWORD;

const ADMIN = {
  name: "Administration",
  isSelectable: true,
  childrenAllowed: false,
  sortOrder: 0,
}

const TEAM_TREE = [
  {
    name: "Direktion",
    isSelectable: true,
    childrenAllowed: false,
    sortOrder: 1,
  },
  {
    name: "Abteilung 1",
    isSelectable: false,
    childrenAllowed: true,
    sortOrder: 10,
    children: [
      { name: "Referat 11", isSelectable: true, childrenAllowed: false, sortOrder: 11 },
      { name: "Referat 12", isSelectable: true, childrenAllowed: false, sortOrder: 12 },
      { name: "Referat 13", isSelectable: true, childrenAllowed: false, sortOrder: 13 },
      { name: "Referat 14", isSelectable: true, childrenAllowed: false, sortOrder: 14 },
    ],
  },
  {
    name: "Abteilung 2",
    isSelectable: false,
    childrenAllowed: true,
    sortOrder: 20,
    children: [
      { name: "Referat 21", isSelectable: true, childrenAllowed: false, sortOrder: 21 },
    ],
  },
  {
    name: "Abteilung 3",
    isSelectable: false,
    childrenAllowed: true,
    sortOrder: 30,
    children: [
      { name: "Referat 31", isSelectable: true, childrenAllowed: false, sortOrder: 31 },
      { name: "Referat 32", isSelectable: true, childrenAllowed: false, sortOrder: 32 },
      { name: "Referat 33", isSelectable: true, childrenAllowed: false, sortOrder: 33 },
    ],
  },
  {
    name: "Abteilung 4",
    isSelectable: false,
    childrenAllowed: true,
    sortOrder: 40,
    children: [
      { name: "Referat 41", isSelectable: true, childrenAllowed: false, sortOrder: 41 },
      { name: "Referat 42", isSelectable: true, childrenAllowed: false, sortOrder: 42 },
      { name: "Referat 43", isSelectable: true, childrenAllowed: false, sortOrder: 43 },
    ],
  },
  {
    name: "Querschnittsreferat Marketing / Öffentlichkeitsarbeit",
    isSelectable: true,
    childrenAllowed: true,
    sortOrder: 50,
  },
  {
    name: "Querschnittsreferat IT / Administration",
    isSelectable: true,
    childrenAllowed: true,
    sortOrder: 51,
  },
  {
    name: "Querschnittsreferat Verwaltung",
    isSelectable: false,
    childrenAllowed: true,
    sortOrder: 52,
    children: [
      { name: "Personal", isSelectable: true, childrenAllowed: false, sortOrder: 521 },
      { name: "Finanzen", isSelectable: true, childrenAllowed: false, sortOrder: 522 },
      { name: "Juristik", isSelectable: true, childrenAllowed: false, sortOrder: 523 },
      { name: "Arbeitsschutz", isSelectable: true, childrenAllowed: false, sortOrder: 524 },
    ],
  },
  {
    name: "Stabsstelle Medienzentrenverbund",
    isSelectable: true,
    childrenAllowed: true,
    sortOrder: 60,
  },
  {
    name: "Stabsstelle Projektmanagement",
    isSelectable: true,
    childrenAllowed: true,
    sortOrder: 61,
  },
  {
    name: "Stabsstelle Zukunft des Lernens",
    isSelectable: true,
    childrenAllowed: true,
    sortOrder: 62,
  },
  {
    name: "Stadtmedienzentrum Karlsruhe",
    isSelectable: true,
    childrenAllowed: true,
    sortOrder: 70,
  },
  {
    name: "Stadtmedienzentrum Stuttgart",
    isSelectable: true,
    childrenAllowed: true,
    sortOrder: 71,
  },
]

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
      childrenAllowed: node.childrenAllowed,
      isSelectable: !!node.isSelectable,
      sortOrder: node.sortOrder ?? 0,
      isActive: node.isActive ?? true,
    },
    create: {
      id: node.name === "Administration" ? 57 : undefined,
      name: node.name,
      passwordHash: node.isSelectable ? passwordHash : null,
      parentId,
      childrenAllowed: node.childrenAllowed,
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
  await upsertNode(ADMIN);
  for (const node of TEAM_TREE) {
    await upsertNode(node);
  }
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