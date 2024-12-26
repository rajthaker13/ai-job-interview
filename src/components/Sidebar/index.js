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
              <span className="ml-2 text-lg font-bold text-white">CodeRoyale</span>
            </NavLink>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col p-4">
            <NavLink to="/dashboard" className="flex items-center p-2 text-white hover:bg-[#1A1A2E] rounded-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
              </svg>
              Dashboard
            </NavLink>
            {/* Add more navigation items here */}
          </nav>
        </aside>
      )}
    </>
  );
};

export default Sidebar;
