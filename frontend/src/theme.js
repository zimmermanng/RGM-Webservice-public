export const applyTheme = (activeCompany) => {
  const company = activeCompany === "LMZ" ? "LMZ" : "Shuffle";

  const root = document.getElementById("root");

  document.body.setAttribute("data-company", company);
  document.body.classList.remove("LMZ", "Shuffle");
  document.body.classList.add(company);

  if (root) {
    root.setAttribute("data-company", company);
    root.classList.remove("LMZ", "Shuffle");
    root.classList.add(company);
  }
};