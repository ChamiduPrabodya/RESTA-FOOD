import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

function ProtectedRoute({ roles, children }) {
  const { authUser } = useAuth();
  const location = useLocation();

  if (!authUser) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(authUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
