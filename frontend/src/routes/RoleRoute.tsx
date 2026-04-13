import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/redux";

type Props = {
  role: "ADMIN" | "FARMER";
  children: React.ReactNode;
};

const RoleRoute = ({ role, children }: Props) => {
  const userRole = useSelector((s: RootState) => s.farmer.data?.role);
  if (!userRole) return <Navigate to="/login" replace />;
  if (userRole !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RoleRoute;
