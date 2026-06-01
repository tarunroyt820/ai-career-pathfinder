import { Navigate, Outlet } from "react-router-dom";
import { hasValidToken } from "./authUtils";

export const ProtectedRoute = () => {
    if (!hasValidToken()) {
        localStorage.removeItem("nextro_token");
        localStorage.removeItem("nextro_refresh_token");
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
