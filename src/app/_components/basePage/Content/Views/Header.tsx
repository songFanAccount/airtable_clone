import type { FieldsData, ViewDetailedData } from "../../BasePage"
import { IoMdMenu as MenuIcon } from "react-icons/io";
import { MdOutlineTableChart as TableIcon } from "react-icons/md";
import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/outline";
import ViewConfigs from "./ViewConfigs";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "react-toastify";

const ViewSearch = () => {
  return (
    <button className="w-7 h-7 mr-2 flex justify-center items-center hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer text-gray-600">
      <SearchIcon className="w-4 h-4"/>
    </button>
  )
}
const Header = ({ fields, viewData } : { fields: FieldsData, viewData: ViewDetailedData }) => {
  return (
    <div className="h-[48px] border-box border-b-[1px] flex flex-row justify-between items-center gap-2 flex-shrink-0"
      style={{
        borderColor: "#dfe2e4"
      }}
    >
      <div className="flex flex-row items-center pl-4 pr-2 gap-2">
        <Dialog.Trigger asChild>
          <button className="w-8 h-8 flex justify-center items-center hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer text-gray-600">
            <MenuIcon className="w-4 h-4"/>
          </button>
        </Dialog.Trigger>
        <button className="px-2 hover:bg-[#f2f2f2] h-[26px] flex flex-row items-center gap-2 cursor-pointer rounded-[3px]"
          onClick={() => toast("To rename/delete view, hover the view from the side bar and open options.")}
        >
          <TableIcon className="w-4 h-4 text-[#3380e5]"/>
          <span className="text-[13px] font-[500]">{viewData?.name}</span>
          <DropdownIcon className="w-4 h-4 text-gray-700"/>
        </button>
      </div>
      <div className="flex flex-1 flex-row items-center justify-end pr-2">
        <div className="flex flex-row items-center gap-4">
          {viewData && <ViewConfigs view={viewData} fields={fields}/>}
          <ViewSearch/>
        </div>
      </div>
    </div>
  )
}
export default Header