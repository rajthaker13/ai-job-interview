import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "../../assets/coderoyale.png";

const Sidebar = () => {
  const location = useLocation();
  const { pathname } = location;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const trigger = useRef(null);
  const sidebar = useRef(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  useEffect(() => {
    console.log(location.pathname);
    if (location.pathname === "/signup" || location.pathname === "/login" || location.pathname === "/" || location.pathname === "/interview" || location.pathname === "/report") {
      setSidebarOpen(false);
    }
    else {
      setSidebarOpen(true);
    }
  }, [pathname]);

  // close on click outside
  // useEffect(() => {
  //   const clickHandler = ({ target }) => {
  //     if (!sidebar.current || !trigger.current) return;
  //     if (
  //       !sidebarOpen ||
  //       sidebar.current.contains(target) ||
  //       trigger.current.contains(target)
  //     )
  //       return;
  //     setSidebarOpen(false);
  //   };
  //   document.addEventListener("click", clickHandler);
  //   return () => document.removeEventListener("click", clickHandler);
  // });

  // close if the esc key is pressed
  // useEffect(() => {
  //   const keyHandler = ({ keyCode }) => {
  //     if (!sidebarOpen || keyCode !== 27) return;
  //     setSidebarOpen(false);
  //   };
  //   document.addEventListener("keydown", keyHandler);
  //   return () => document.removeEventListener("keydown", keyHandler);
  // });

  // useEffect(() => {
  //   localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
  //   if (sidebarExpanded) {
  //     document.querySelector("body")?.classList.add("sidebar-expanded");
  //   } else {
  //     document.querySelector("body")?.classList.remove("sidebar-expanded");
  //   }
  // }, [sidebarExpanded]);

  return (
    <>
      {sidebarOpen && (
        <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col bg-[#0D0D1A] shadow-lg">
          <div className="flex items-center justify-between p-4">
            <NavLink to="/" className="flex items-center">
              <img src={Logo} className="w-10 h-10" alt="Logo" />
            </NavLink>
          </div>
          <nav className="flex flex-col p-4 space-y-2">
            {/* <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-300 hover:bg-[#1A1A2E] hover:text-white'
                }`
              }
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </NavLink> */}

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-300 hover:bg-[#1A1A2E] hover:text-white'
                }`
              }
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </NavLink>

            {/* Battles Tab with Coming Soon Tag */}
            <div className="relative flex items-center p-2 text-gray-500 rounded-lg cursor-not-allowed">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Battles
              <span className="absolute right-2 top-2 px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                Coming Soon
              </span>
            </div>
          </nav>
        </aside>
      )}
    </>
  );
};

export default Sidebar;
