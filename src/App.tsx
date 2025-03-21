import "./App.css";
import Homepage from "./pages/homepage";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import Users from "./pages/users";

const router = createBrowserRouter([
  {
    path: "/:name",
    element: <Homepage />,
  },
  {
    path: "/",
    element: <Users />,
  },
]);

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
