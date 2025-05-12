import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faTrashAlt,
  faRightFromBracket,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { Dispatch, SetStateAction } from "react";
import Logo from "../assets/img/Logo.png";
import SmallLogo from "../assets/img/image.png";

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
  return (
    <aside
      className={`bg-white shadow-lg h-full fixed top-0 left-0 z-50 transition-all duration-300
  ${sidebarOpen ? "w-64" : "w-16"}
  ${sidebarOpen ? "block" : "hidden"} md:block`}
    >
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="md:hidden border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src="https://ui-avatars.com/api/?name=Jasmeen&background=random"
                  alt="User Avatar"
                  className="h-10 w-10 rounded-full object-cover"
                />

                <div className="flex flex-col">
                  <span className="text-xs uppercase">Hello</span>
                  <span className="font-medium text-sm text-gray-800 truncate max-w-[160px] block">
                    {userEmail}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between w-full px-4 pt-4 md:flex">
            <img
              src={sidebarOpen ? Logo : SmallLogo}
              alt="Logo"
              className={`object-contain ${sidebarOpen ? "h-10" : "h-8 w-8"}`}
            />
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
            <div className="md:hidden">
              <Link
                to="#"
                onClick={handleLogout}
                className="flex items-center my-2 mx-2 px-4 py-2 text-md font-medium hover:bg-orange-600 hover:text-white cursor-pointer rounded-lg"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />
                {sidebarOpen && "Logout"}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
