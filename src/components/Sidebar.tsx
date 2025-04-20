import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTachometerAlt, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo.png";

interface SidebarProps {
  sidebarOpen: boolean;
}

export default function Sidebar({ sidebarOpen }: SidebarProps) {
  return (
    <aside className={`bg-white shadow-lg h-full fixed top-0 left-0 transition-all duration-300 z-10 ${sidebarOpen ? "w-63" : "w-16"}`}>
      <div className="flex flex-col items-center justify-between h-full">
        <div>
          <div className="px-5 py-5 shadow">
            {sidebarOpen && <img src={Logo} alt="Logo" className="h-10" />}
          </div>
          <nav className="mt-4">
            <Link to="/dashboard" className="flex items-center my-2 mx-5 px-4 py-2 text-md font-medium hover:bg-orange-600 hover:text-white cursor-pointer rounded-lg">
              <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
              {sidebarOpen && "Dashboard"}
            </Link>
            <Link to="/discard" className="flex items-center my-2 mx-5 px-4 py-2 text-md font-medium hover:bg-orange-600 hover:text-white cursor-pointer rounded-lg">
              <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
              {sidebarOpen && "Discard"}
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
