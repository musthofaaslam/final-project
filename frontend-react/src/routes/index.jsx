import {Navigate, createBrowserRouter} from 'react-router-dom';
import PrivateRoute from './PrivateRoutes';
import PublicRoute from './PublicRoutes';

// import components

export const router = createBrowserRouter([
    {
        element: <PublicRoute />,
        children: [
            {
            //     path: "/nama-route",
            //     element: <nama komponen />
            }
        ]
    },
    {
        element: <PrivateRoute />,
        children: [
            {
                // path: "/dashboard",
                // element: <DashboardPage />
            }
        ]
    },
    // 404 dan redirect
    {
        path: "/",
        element: <Navigate to="/dashboard" replace />
    },
    {
        path: "*",
        element: <NotFoundPage />
    }
]);