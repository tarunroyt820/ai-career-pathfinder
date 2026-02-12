import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
    const token = localStorage.getItem("nextro_token");

    if (!token) {
        // If no token, redirect to login
        return <Navigate to="/login" replace />;
    }

    // If token exists, render the child routes
    return <Outlet />;
};
