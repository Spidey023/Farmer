import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Rootpage from "./pages/Root.page";
import DashBoardPage from "./pages/dashboard/DashBoard.page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Rootpage />,
    errorElement: <div>Oops! There was an error.</div>,
    children: [
      { path: "/", element: <DashBoardPage /> },
      { path: "/dashboard", element: <DashBoardPage /> },
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
