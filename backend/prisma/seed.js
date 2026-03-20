const prisma = require("../db/prisma");

const TEAM_TREE = {
  name: "Direktion",
  isSelectable: false,
  sortOrder: 1,
  children: [
    {
      name: "Abteilung 1",
      isSelectable: false,
      sortOrder: 10,
      children: [
        { name: "Referat 11", isSelectable: true, sortOrder: 11 },
        { name: "Referat 12", isSelectable: true, sortOrder: 12 },
        { name: "Referat 13", isSelectable: true, sortOrder: 13 },
        { name: "Referat 14", isSelectable: true, sortOrder: 14 },
      ],
    },
    {
      name: "Abteilung 2",
      isSelectable: false,
      sortOrder: 20,
      children: [
        { name: "Referat 21", isSelectable: true, sortOrder: 21 },
      ],
    },
    {
      name: "Abteilung 3",
      isSelectable: false,
      sortOrder: 30,
      children: [
        { name: "Referat 31", isSelectable: true, sortOrder: 31 },
        { name: "Referat 32", isSelectable: true, sortOrder: 32 },
        { name: "Referat 33", isSelectable: true, sortOrder: 33 },
      ],
    },
    {
      name: "Abteilung 4",
      isSelectable: false,
      sortOrder: 40,
      children: [
        { name: "Referat 41", isSelectable: true, sortOrder: 41 },
        { name: "Referat 42", isSelectable: true, sortOrder: 42 },
        { name: "Referat 43", isSelectable: true, sortOrder: 43 },
      ],
    },
    {
      name: "Querschnittsreferat Marketing / Öffentlichkeitsarbeit",
      isSelectable: true,
      sortOrder: 50,
    },
    {
      name: "Querschnittsreferat IT / Administration",
      isSelectable: true,
      sortOrder: 51,
    },
    {
      name: "Querschnittsreferat Verwaltung",
      isSelectable: false,
      sortOrder: 52,
      children: [
        { name: "Personal", isSelectable: true, sortOrder: 521 },
        { name: "Finanzen", isSelectable: true, sortOrder: 522 },
        { name: "Juristik", isSelectable: true, sortOrder: 523 },
        { name: "Arbeitsschutz", isSelectable: true, sortOrder: 524 },
      ],
    },
    {
      name: "Stabsstelle Medienzentrenverbund",
      isSelectable: true,
      sortOrder: 60,
    },
    {
      name: "Stabsstelle Projektmanagement",
      isSelectable: true,
      sortOrder: 61,
    },
    {
      name: "Stabsstelle Zukunft des Lernens",
      isSelectable: true,
      sortOrder: 62,
    },
    {
      name: "Stadtmedienzentrum Karlsruhe",
      isSelectable: true,
      sortOrder: 70,
    },
    {
      name: "Stadtmedienzentrum Stuttgart",
      isSelectable: true,
      sortOrder: 71,
    },
  ],
};

async function upsertNode(node, parentId = null) {
  const saved = await prisma.team.upsert({
    where: { name: node.name },
    update: {
      parentId,
      isSelectable: !!node.isSelectable,
      sortOrder: node.sortOrder ?? 0,
      isActive: node.isActive ?? true,
    },
    create: {
      name: node.name,
      parentId,
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