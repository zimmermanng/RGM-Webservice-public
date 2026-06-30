/**
 * Converts saved Shuffle questionnaire answers into result rows.
 * The service applies the pass logic used by the questionnaire: an answer at a
 * question's highest stufe does not lower the handlungsfeld rating, but it can
 * still count as an already established recommendation.
 *
 * Source JSON inputs:
 * - struktur.json defines dimensions, handlungsfelder, and question references.
 * - fragen.json defines questions, answers, stufen, and handlungsfeld links.
 * - handlungsempfehlungen.json maps recommendations to answer ids.
 */
// ---------------- Source indexes ----------------
export const indexStructure = (struktur) => {
  const map = {};
  for (const dim of struktur.dimensionen || []) {
    const group = dim.name;
    for (const hf of dim.handlungsfelder || []) {
      const category = hf.name;
      for (const f of hf.fragen || []) {
        map[f.id] = { group, category, handlungsfeldId: hf.id };
      }
    }
  }
  return map;
};

export const categoriesForDimension = (struktur, dimensionId) => {
  const dim = (struktur.dimensionen || []).find((d) => d.id === dimensionId);
  if (!dim) return [];
  const group = dim.name;
  return (dim.handlungsfelder || []).map((hf) => ({
    group,
    category: hf.name,
    handlungsfeldId: hf.id,
  }));
};

// ---------------- Answer metadata from fragen.json ----------------
export const buildAnswerMeta = (fragen) => {
  const answerMetaById = new Map(); // answerId -> { stufe, handlungsfeldId, frageId, antwort }
  const questionById   = new Map(); // frageId  -> { id, frage }
  for (const q of (fragen?.fragen || [])) {
    questionById.set(q.id, { id: q.id, frage: q.frage });
    for (const a of (q.antworten || [])) {
      if (!a?.id) continue;
      const stufe = Number.isFinite(+a.stufe) ? +a.stufe : null;
      const hfId  = a.handlungsfeldId || null;
      if (!answerMetaById.has(a.id)) {
        answerMetaById.set(a.id, {
          stufe, handlungsfeldId: hfId, frageId: q.id, antwort: a.antwort || ""
        });
      }
    }
  }
  return { answerMetaById, questionById };
};

// Highest available stufe per question and handlungsfeld.
const buildMaxStufeIndexes = (fragen) => {
  const qMaxByQId  = new Map(); // frageId -> max stufe for that question
  const hfMaxByHfId = new Map(); // hfId -> max stufe across all answers in HF
  let globalMax = -Infinity;

  for (const q of (fragen?.fragen || [])) {
    let qMax = -Infinity;
    for (const a of (q.antworten || [])) {
      const st = Number.isFinite(+a.stufe) ? +a.stufe : null;
      if (st == null) continue;
      qMax = Math.max(qMax, st);
      globalMax = Math.max(globalMax, st);
      const hfId = a.handlungsfeldId || null;
      if (hfId) {
        const cur = hfMaxByHfId.get(hfId);
        hfMaxByHfId.set(hfId, Math.max(cur ?? -Infinity, st));
      }
    }
    if (qMax > -Infinity) qMaxByQId.set(q.id, qMax);
  }

  // Fallback for incomplete handlungsfeld data in the source JSON.
  for (const [hfId, v] of hfMaxByHfId.entries()) {
    if (v === -Infinity) hfMaxByHfId.set(hfId, globalMax > -Infinity ? globalMax : 4);
  }

  return {
    qMaxByQId,
    hfMaxByHfId,
    globalMaxStufe: globalMax > -Infinity ? globalMax : 4
  };
};


// ---------------- Base result rows (min stufe per HF) with "pass" logic ----------------
export const answersToResults = (selectedAnswers, struktur, fragen, dimensionId) => {
  const idx = indexStructure(struktur);
  const categories = categoriesForDimension(struktur, dimensionId);
  const { qMaxByQId, hfMaxByHfId, globalMaxStufe } = buildMaxStufeIndexes(fragen);

  // hfId -> bucket
  const buckets = new Map();
  for (const c of categories) {
    const catMax = hfMaxByHfId.get(c.handlungsfeldId);
    buckets.set(c.handlungsfeldId, {
      min: Infinity,
      any: false,
      constraining: false,
      categoryMaxStufe: Number.isFinite(catMax) ? catMax : globalMaxStufe,
      ...c,
    });
  }

  // Fold answers: only answers BELOW their question's max stufe constrain the rating.
  for (const entry of Object.values(selectedAnswers || {})) {
    const meta = idx[entry.frageId];
    if (!meta) continue;
    const b = buckets.get(meta.handlungsfeldId);
    if (!b) continue;

    b.any = true;

    const stufe = Number(entry.stufe);
    if (!Number.isFinite(stufe)) continue;

    const qMax = qMaxByQId.get(entry.frageId);
    // If user selected the question's MAX stufe, we ignore it for rating (treated as "passed").
    const constrains = Number.isFinite(qMax) ? stufe < qMax : true;

    if (constrains) {
      b.min = Math.min(b.min, stufe);
      b.constraining = true;
    }
  }

  // Build rows: if no constraining selections but some answers exist,
  // the category achieves its own maximum (categoryMaxStufe + 1).
  const rows = [];
  for (const { group, category, handlungsfeldId } of categories) {
    const b = buckets.get(handlungsfeldId);
    let value;
    if (!b || !b.any) {
      value = 0; // not rated
    } else if (b.constraining) {
      value = b.min + 1; // 1..5
    } else {
      value = b.categoryMaxStufe + 1; // full credit for this category
    }
    rows.push({ group, category, value, handlungsfeldId });
  }

  return rows;
};

// ---------------- Recommendations per HF ----------------
// Expand each recommendation into one entry *per HF it touches*.
// Compute its stufe using only the answers linked *in that HF*.
const buildRecommendationsByHf = (handlEmpf, answerMetaById) => {
  const recsByHf = new Map(); // hfId -> [{ id, name, stufe, answerIds }]
  for (const r of (handlEmpf?.handlungsempfehlungen || [])) {
    const byHf = new Map(); // hfId -> answerIds[]
    for (const a of (r.antworten || [])) {
      const meta = answerMetaById.get(a.id);
      const hfId = a.handlungsfeldId || meta?.handlungsfeldId || null;
      if (!hfId) continue;
      if (!byHf.has(hfId)) byHf.set(hfId, []);
      byHf.get(hfId).push(a.id);
    }

    for (const [hfId, ansIds] of byHf.entries()) {
      let minStufe = Infinity;
      let any = false;
      for (const id of ansIds) {
        const m = answerMetaById.get(id);
        if (m?.stufe != null) {
          minStufe = Math.min(minStufe, m.stufe);
          any = true;
        }
      }
      if (!any) continue; // Recommendation cannot be graded for this handlungsfeld.
      const list = recsByHf.get(hfId) || [];
      list.push({ id: r.id, name: r.name, stufe: minStufe, answerIds: ansIds });
      recsByHf.set(hfId, list);
    }
  }
  return recsByHf;
};

// ---------------- Recommendation enrichment ----------------
const isEstablished = (recAnswerIds, selectedAnswerIdsInHf) => {
  const matched = recAnswerIds.filter((id) => selectedAnswerIdsInHf.has(id));
  return { established: matched.length > 0, matchedAnswerIds: matched };
};

export const enrichWithRecommendations = ({
  rows,
  selectedAnswers,
  struktur,
  fragen,
  handlEmpf,
}) => {
  const { answerMetaById } = buildAnswerMeta(fragen);

  // Selected answer IDs per HF (all selections count here,
  // including those "passed" for rating purposes)
  const idx = indexStructure(struktur);
  const selectedByHf = new Map(); // hfId -> Set(answerId)
  for (const entry of Object.values(selectedAnswers || {})) {
    const meta = idx[entry.frageId];
    if (!meta) continue;
    if (!selectedByHf.has(meta.handlungsfeldId)) selectedByHf.set(meta.handlungsfeldId, new Set());
    selectedByHf.get(meta.handlungsfeldId).add(entry.antwortId);
  }

  const recsByHf = buildRecommendationsByHf(handlEmpf, answerMetaById);

  return rows.map((row) => {
    const currentMinStufe = row.value > 0 ? row.value - 1 : null; // convert UI value back to 0-based stufe
    const hfId = row.handlungsfeldId;
    const allRecs = recsByHf.get(hfId) || [];
    const selectedIdsInHf = selectedByHf.get(hfId) || new Set();

    if (currentMinStufe == null) return { ...row, recommendations: [] };

    const todos = [];
    const established = [];

    for (const rec of allRecs) {
      const { established: ok, matchedAnswerIds } = isEstablished(rec.answerIds, selectedIdsInHf);

      if (rec.stufe === currentMinStufe && !ok) {
        // Only current level as TODO
        todos.push({
          id: rec.id,
          text: rec.name,
          level: rec.stufe + 1, // 1..5 for UI
          status: "todo",
        });
      } else if (rec.stufe >= currentMinStufe && ok) {
        // Current or higher level, but already covered
        established.push({
          id: rec.id,
          text: rec.name,
          level: rec.stufe + 1, // 1..5 for UI
          status: "already established",
          matchedAnswerIds,
        });
      }
    }

    return {
      ...row,
      recommendations: [...todos, ...established],
    };
  });
};

// ---------------- Public conversion API ----------------
export const answersToResultsWithRecommendations = ({
  selectedAnswers,
  struktur,
  fragen,
  handlEmpf,
  dimensionId,
}) => {
  const baseRows = answersToResults(selectedAnswers, struktur, fragen, dimensionId);
  const enriched = enrichWithRecommendations({
    rows: baseRows,
    selectedAnswers,
    struktur,
    fragen,
    handlEmpf,
  });
  // Hide the internal handlungsfeld id from UI-facing result rows.
  return enriched.map(({ handlungsfeldId, ...rest }) => rest);
};
