import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Rootpage from "./pages/Root.page";
import DashBoardPage from "./pages/dashboard/DashBoard.page";
import Errorpage from "./pages/error/Error.page";
import ProductsPage from "./pages/products/Products.page";
import FieldsPage from "./pages/fields/Fields.page";
import FarmerPage from "./pages/farmer/Farmer.page";
import CartPage from "./pages/cart/Cart.page";
import FieldsListPage from "./pages/fields/FieldsList.page";
import FieldDetailComponent from "./components/fields/FieldDetail.Component";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Rootpage />,
    errorElement: <Errorpage />,
    children: [
      { path: "/", element: <DashBoardPage /> },
      { path: "/products", element: <ProductsPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/profile", element: <FarmerPage /> },
      {
        path: "/fields",
        element: <FieldsPage />,
        children: [
          { path: "fields-list", element: <FieldsListPage /> },
          { path: ":fieldId", element: <FieldDetailComponent /> },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
