export const applyTheme = () => {
  const company = "Shuffle";
  const root = document.getElementById("root");

  document.body.setAttribute("data-company", company);
  document.body.classList.remove("LMZ");
  document.body.classList.add(company);

  if (root) {
    root.setAttribute("data-company", company);
    root.classList.remove("LMZ");
    root.classList.add(company);
  }
};
