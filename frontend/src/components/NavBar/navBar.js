import HeaderDesktop from "./headerDesktop";

const NavBar = ({ activeCompany, onLogout, team }) => {
  return (
    <div>
      <HeaderDesktop
        activeCompany={activeCompany}
        onLogout={onLogout}
        team={team}
      />
    </div>
  );
};

export default NavBar;