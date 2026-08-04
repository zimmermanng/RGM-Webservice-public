import { answersToResults } from "./questionnaireToResults";

const struktur = {
  dimensionen: [
    {
      id: "D1",
      name: "Päckchen",
      handlungsfelder: [
        {
          id: "H1",
          name: "Handlungsfeld",
          fragen: [{ id: "F1" }, { id: "F2" }],
        },
      ],
    },
  ],
};

const fragen = {
  fragen: [
    {
      id: "F1",
      antworten: [
        { id: "A1-low", stufe: 1, handlungsfeldId: "H1" },
        { id: "A1-max", stufe: 3, handlungsfeldId: "H1" },
      ],
    },
    {
      id: "F2",
      antworten: [
        { id: "A2-low", stufe: 2, handlungsfeldId: "H1" },
        { id: "A2-max", stufe: 4, handlungsfeldId: "H1" },
      ],
    },
  ],
};

const selection = (frageId, antwortId, stufe = -999) => ({
  frageId,
  antwortId,
  stufe,
});

test("awards level 4 when every question uses its own highest answer", () => {
  const rows = answersToResults(
    {
      F1: selection("F1", "A1-max"),
      F2: selection("F2", "A2-max"),
    },
    struktur,
    fragen,
    "D1"
  );

  expect(rows[0].value).toBe(5);
});

test("uses the authoritative answer level instead of a stale stored level", () => {
  const rows = answersToResults(
    {
      F1: selection("F1", "A1-max", 0),
      F2: selection("F2", "A2-max", 0),
    },
    struktur,
    fragen,
    "D1"
  );

  expect(rows[0].value).toBe(5);
});

test("does not award level 4 while expected questions are unanswered", () => {
  const rows = answersToResults(
    { F1: selection("F1", "A1-max") },
    struktur,
    fragen,
    "D1"
  );

  expect(rows[0].value).toBe(4);
});

test("uses the lowest constraining answer when not every answer is maximal", () => {
  const rows = answersToResults(
    {
      F1: selection("F1", "A1-max"),
      F2: selection("F2", "A2-low"),
    },
    struktur,
    fragen,
    "D1"
  );

  expect(rows[0].value).toBe(3);
});

test("uses dimension and field context if a question ID is reused in the future", () => {
  const reusedStruktur = {
    dimensionen: [
      ...struktur.dimensionen,
      {
        id: "D2",
        name: "Zweites Päckchen",
        handlungsfelder: [
          {
            id: "H2",
            name: "Zweites Handlungsfeld",
            fragen: [{ id: "F1" }],
          },
        ],
      },
    ],
  };
  const reusedFragen = {
    fragen: [
      ...fragen.fragen,
      {
        id: "F1",
        antworten: [
          { id: "A1-H2-low", stufe: 1, handlungsfeldId: "H2" },
          { id: "A1-H2-max", stufe: 2, handlungsfeldId: "H2" },
        ],
      },
    ],
  };

  const rows = answersToResults(
    {
      F1: {
        ...selection("F1", "A1-H2-max"),
        dimensionId: "D2",
        handlungsfeldId: "H2",
      },
    },
    reusedStruktur,
    reusedFragen,
    "D2"
  );

  expect(rows[0].value).toBe(5);
});
