/**
 * Applies the single supported Shuffle theme to the document.
 * Older versions of the app supported multiple company layouts; this cleanup
 * keeps the Shuffle class/data attributes as the active styling contract.
 */
export const applyTheme = () => {
  const company = "Shuffle";
  const root = document.getElementById("root");

  document.body.setAttribute("data-company", company);
  document.body.classList.add(company);

  if (root) {
    root.setAttribute("data-company", company);
    root.classList.add(company);
  }
};