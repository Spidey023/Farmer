import { createBrowserRouter } from "react-router-dom";
import SignInPage from "../pages/auth/SignIn.page";
import SignUpPage from "../pages/auth/SignUp.page";
import AppLayout from "../layout/AppLayout";
import DashBoardPage from "../pages/dashboard/DashBoard.page";
import ProductsPage from "../pages/products/Products.page";
import CartPage from "../pages/cart/Cart.page";
import FarmerPage from "../pages/farmer/Farmer.page";
import FieldsPage from "../pages/fields/Fields.page";
import FieldsListPage from "../pages/fields/FieldsList.page";
import FieldDetailComponent from "../components/fields/FieldDetail.Component";
import CreateFieldPage from "../components/fields/CreateFieldPage";
import ProtectedRoute from "./ProtectedRoute";
import LeasePage from "../pages/lease/Lease.page";
import OrdersPage from "../pages/orders/Orders.page";
import OrderDetailPage from "../pages/orders/OrderDetail.page";
import AnalyticsPage from "../pages/analytics/Analytics.page";
import AdminPage from "../pages/admin/Admin.page";
import AdminProductsPage from "../pages/admin/AdminProducts.page";
import AdminLeasesPage from "../pages/admin/AdminLeases.page";
import AdminOrdersPage from "../pages/admin/AdminOrders.page";
import AdminCropsPage from "../pages/admin/AdminCrops.page";
import RoleRoute from "./RoleRoute";
import AdminSeasonsPage from "../pages/admin/AdminSeasons.page";

const router = createBrowserRouter([
  // 🔓 PUBLIC ROUTES (NO SIDEBAR / NO APP LAYOUT)
  {
    path: "/login",
    element: <SignInPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },

  // 🔐 PROTECTED APP ROUTES
  {
    path: "/",
    element: <ProtectedRoute />, // auth check here
    children: [
      {
        element: <AppLayout />, // sidebar + topnav only after login
        children: [
          { index: true, element: <DashBoardPage /> },
          { path: "lease", element: <LeasePage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          {
            path: "admin",
            element: (
              <RoleRoute role="ADMIN">
                <AdminPage />
              </RoleRoute>
            ),
          },
          {
            path: "admin/crops",
            element: (
              <RoleRoute role="ADMIN">
                <AdminCropsPage />
              </RoleRoute>
            ),
          },
          {
            path: "admin/products",
            element: (
              <RoleRoute role="ADMIN">
                <AdminProductsPage />
              </RoleRoute>
            ),
          },
          {
            path: "admin/leases",
            element: (
              <RoleRoute role="ADMIN">
                <AdminLeasesPage />
              </RoleRoute>
            ),
          },
          {
            path: "admin/orders",
            element: (
              <RoleRoute role="ADMIN">
                <AdminOrdersPage />
              </RoleRoute>
            ),
          },
          {
            path: "admin/seasons",
            element: (
              <RoleRoute role="ADMIN">
                <AdminSeasonsPage />
              </RoleRoute>
            ),
          },
          { path: "products", element: <ProductsPage /> },
          { path: "cart", element: <CartPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:orderId", element: <OrderDetailPage /> },
          { path: "profile", element: <FarmerPage /> },

          {
            path: "fields",
            element: <FieldsPage />,
            children: [
              { path: "fields-list", element: <FieldsListPage /> },
              { path: ":fieldId", element: <FieldDetailComponent /> },
              { path: "create", element: <CreateFieldPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
