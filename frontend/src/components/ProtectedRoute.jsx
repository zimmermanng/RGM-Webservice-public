import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  authChecked,
  isAuthenticated,
  team,
  requireTeam = true,
  children,
}) => {
  if (!authChecked) {
    return (
      <div
        className="access-loading"
        role="status"
        aria-live="polite"
      >
        Lade Zugangsstatus...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireTeam && !team) {
    return <Navigate to="/team-select" replace />;
  }

  return children;
};

export default ProtectedRoute;