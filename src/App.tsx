import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Discard from "./pages/Discard";
import GlobalLoader from "./components/GlobalLoader";
import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";
import { PrivateRoute } from "./components/PrivateRoute";
import { PublicRoute } from "./components/PublicRoute";

function App() {
  return (
    <>
      <GlobalLoader />
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/discard"
          element={
            <PrivateRoute>
              <Discard />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
