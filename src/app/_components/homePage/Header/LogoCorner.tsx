import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSmallerThan600 } from "~/hooks/helpers";

const LogoCorner = () => {
  const showExpandButton = !useSmallerThan600()
  return (
    <div className="flex items-center justify-start h-full w-full min-w-[170px]">
      <div className="flex items-center h-full w-full">
        {
          showExpandButton &&
          <button className="pl-1 pr-2">
            <Bars3Icon className="w-5 h-5 text-gray-400" />
          </button>
        }
        <div className="flex flex-row items-center gap-x-1 p-3">
          <img src="/assets/airtable.svg" alt="Airtable" className="h-[24px] w-[24px]" />
          <p className="font-medium text-lg pt-0.5">Airtable</p>
        </div>
      </div>
    </div>
  );
};

export default LogoCorner;