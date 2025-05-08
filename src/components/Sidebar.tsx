import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faTrashAlt,
  faUser,
  faRightFromBracket,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import Logo from "../assets/Logo.png";
import SmallLogo from "../assets/image.png";
import { useState } from "react";

interface SidebarProps {
  sidebarOpen: boolean;
  userEmail: string;
  handleLogout: () => void;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({
  sidebarOpen,
  userEmail,
  handleLogout,
  setSidebarOpen,
}: SidebarProps) {
  const [showLogout, setShowLogout] = useState(false);
  return (
    <aside
      className={`bg-white shadow-lg h-full fixed top-0 left-0 z-50 transition-all duration-300
    ${sidebarOpen ? "w-64" : "w-16"}
    ${sidebarOpen ? "block" : "hidden"} md:block`}
    >
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between w-full px-4 pt-4">
            <img
              src={sidebarOpen ? Logo : SmallLogo}
              alt="Logo"
              className={`object-contain ${sidebarOpen ? "h-10" : "h-8 w-8"}`}
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden ml-2 text-sm text-gray-400 -mt-10"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <nav className="mt-4">
            <Link
              to="/dashboard"
              className="flex items-center my-2 mx-2 px-4 py-2 text-md font-medium hover:bg-orange-600 hover:text-white cursor-pointer rounded-lg"
            >
              <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
              {sidebarOpen && "Dashboard"}
            </Link>
            <Link
              to="/discard"
              className="flex items-center my-2 mx-2 px-4 py-2 text-md font-medium hover:bg-orange-600 hover:text-white cursor-pointer rounded-lg"
            >
              <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
              {sidebarOpen && "Discard"}
            </Link>

            {sidebarOpen && (
              <div className="relative md:hidden">
                <div
                  onClick={() => setShowLogout((prev) => !prev)}
                  className="flex items-center my-2 mx-2 px-4 py-2 text-md font-medium hover:bg-orange-600 hover:text-white cursor-pointer rounded-lg"
                >
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  <span className="truncate">{userEmail}</span>
                </div>

                {showLogout && (
                  <div
                    className="absolute left-5 mt-1 bg-white shadow-lg rounded-md px-4 py-2 z-50 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-800 text-sm"
                    onClick={handleLogout}
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    <span>Logout</span>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
