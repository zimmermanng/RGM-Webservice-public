import HeaderDesktop from "./headerDesktop";

const NavBar = ({ activeCompany }) => {
  return (
    <div>
      <HeaderDesktop activeCompany={activeCompany} />
    </div>
  );
};

export default NavBar;