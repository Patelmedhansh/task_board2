import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faSignOutAlt,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Dispatch, SetStateAction } from "react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  userEmail: string;
  dropdownOpen: boolean;
  setDropdownOpen: Dispatch<SetStateAction<boolean>>;
  handleLogout: () => void;
}

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  userEmail,
  dropdownOpen,
  setDropdownOpen,
  handleLogout,
}: HeaderProps) {
  return (
    <header
  className={`flex items-center justify-between bg-white p-4 fixed top-0 right-0 z-30 transition-all duration-300
    ${sidebarOpen ? "md:left-64" : "md:left-16"} left-0`}
>

      <div className="flex items-center gap-4 ml-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
      </div>
      <div className="relative mr-4 hidden md:block">
        <div
          className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <FontAwesomeIcon icon={faUserCircle} size="lg" />
          {userEmail && (
            <span className="text-sm font-medium hidden sm:inline">
              {userEmail}
            </span>
          )}
        </div>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-md py-2 z-50">
            <div
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Logout
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
