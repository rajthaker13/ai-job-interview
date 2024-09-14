import { useState } from "react";
import { Link } from "react-router-dom";
import ClickOutside from "../ClickOutside";
import UserOne from ".././../assets/user.png";

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        to="#"
      >
        <span className="hidden text-right lg:block">
          <span className="block text-sm font-medium text-white dark:text-white">
            {/* Thomas Anree */}
          </span>
          {/* <span className="block text-xs">UX Designer</span> */}
        </span>

        <span className="h-12 w-12 rounded-full">
          {/* <img src={UserOne} alt="User" /> */}
        </span>
      </Link>
    </ClickOutside>
  );
};

export default DropdownUser;
