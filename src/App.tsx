import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Discard from "./pages/Discard"
import GlobalLoader from "./components/GlobalLoader";
import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
    <GlobalLoader/>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/discard" element={<Discard />} />
      </Routes>
    </>
  );
}

export default App;
