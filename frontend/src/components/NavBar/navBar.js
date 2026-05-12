import HeaderDesktop from "./headerDesktop";

const NavBar = ({ onLogout, team }) => {
  return (
    <div>
      <HeaderDesktop onLogout={onLogout} team={team} />
    </div>
  );
};

export default NavBar;
