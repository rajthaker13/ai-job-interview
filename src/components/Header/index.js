import { Link, NavLink, useLocation } from "react-router-dom";
import DropdownUser from "./DropdownUser";
import LogoIcon from "../../assets/coderoyale.png";
import { useEffect, useRef, useState } from "react";

const Header = () => {
  const location = useLocation();
  const { pathname } = location;
  const [headerOpen, setHeaderOpen] = useState(false);

  useEffect(() => {
    console.log(location.pathname);
    if (location.pathname === "/signup" || location.pathname === "/login" || location.pathname === "/") {
      setHeaderOpen(false);
    }
    else {
      setHeaderOpen(true);
    }
  }, [pathname]);

  return (
    <>
      {headerOpen && (
        <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-[#0D0D1A] to-[#1A1A2E] border-b border-gray-800">
          <div className="w-full px-6">
            <div className="flex items-center justify-between h-16">
              <Link to="/">
                <img src={LogoIcon} className="h-8 w-auto" alt="CodeRoyale" />
              </Link>
              <div className="flex items-center">
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg transition-colors duration-200 ${isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-300 hover:text-white'
                    }`
                  }
                >
                  Profile
                </NavLink>
              </div>
            </div>
          </div>
        </header>
      )}
    </>
  );
};

export default Header;
