import { Bars3Icon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { toastNoUI, useSmallerThan600 } from "~/hooks/helpers";

const LogoCorner = () => {
  const showExpandButton = !useSmallerThan600()
  const [expandIsHovered, setExpandIsHovered] = useState<boolean>(false)
  return (
    <div className="flex items-center justify-start h-full w-full min-w-[170px]">
      <div className="flex items-center h-full w-full">
        {
          showExpandButton &&
          <button 
            className="pl-1 pr-2 cursor-pointer"
            style={{
              color: expandIsHovered ? "black" : "#99a1af"
            }}
            onMouseEnter={() => setExpandIsHovered(true)}
            onMouseLeave={() => setExpandIsHovered(false)}
            onClick={toastNoUI}
          >
            <Bars3Icon className="w-5 h-5"/>
          </button>
        }
        <Link href="/">
          <div className="flex flex-row items-center gap-x-1 p-3 cursor-pointer">
            <img src="/assets/airtable.svg" alt="Airtable" className="h-[27px] w-[27px]" />
            <p className="font-medium text-[20px] pt-0.5">Airtable</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default LogoCorner;