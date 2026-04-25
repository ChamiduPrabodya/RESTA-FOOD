import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

function ProtectedRoute({ roles, allowGuestTableSession = false, children }) {
  const { authUser, tableContext } = useAuth();
  const location = useLocation();
  const hasGuestTableSession = Boolean(tableContext?.sessionId);

  if (!authUser && !(allowGuestTableSession && hasGuestTableSession)) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (authUser && roles && !roles.includes(authUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
