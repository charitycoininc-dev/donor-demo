import ReactDOM from "react-dom/client";
import "./index.css";
import { router } from "./router/index.jsx";
import { RouterProvider } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
