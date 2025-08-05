import type { FieldsData, ViewDetailedData } from "../../BasePage"
import { IoMdMenu as MenuIcon } from "react-icons/io";
import { MdOutlineTableChart as TableIcon } from "react-icons/md";
import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/outline";
import { RxCross2 as DeleteIcon } from "react-icons/rx";
import { IoIosArrowDown as IncMoveIndexIcon, IoIosArrowUp as DecMoveIndexIcon } from "react-icons/io";
import ViewConfigs from "./ViewConfigs/ViewConfigs";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { toast } from "react-toastify";

interface SearchProps { 
  searchStr: string, 
  setSearchStr: (str: string) => void,
  foundIndex: number,
  numSearchFound: number,
  moveFoundIndex: (direction: 1 | -1) => void
}
const ViewSearch = ({ searchStr, setSearchStr, foundIndex, numSearchFound, moveFoundIndex } : SearchProps) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="w-7 h-7 mr-2 flex justify-center items-center hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer text-gray-800">
          <SearchIcon className="w-4 h-4"/>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          side="bottom"
          align="start"
          className="bg-white w-fit h-[38px] z-50 text-[13px] overflow-clip
            relative right-3 top-[10px] padding-box border-b-[2px] border-l-[2px] border-r-[2px] border-[#dfe2e4]
          "
          style={{
            width: `296px`,
            borderBottomLeftRadius: '3px',
            borderBottomRightRadius: '3px',
          }}
        >
          <div className="flex flex-row items-center gap-2 w-full h-full">
            <input
              type="text"
              value={searchStr}
              onChange={(e) => setSearchStr(e.target.value)}
              placeholder="Find in view"
              className="outline-none px-[10px] flex-1 h-full flex flex-col justify-center font-[500] text-black
                placeholder:text-gray-600 min-w-0
              "
            />
            <div className="flex flex-row items-center">
              {searchStr !== "" &&
                <span className="text-gray-500 text-[11px]">{`${numSearchFound > 0 ? foundIndex+1 : 0} of ${numSearchFound}`}</span>
              }
              <div className="flex flex-row items-center pl-2">
                <button className="flex justify-center items-center cursor-pointer text-gray-600 w-5 h-[22px] bg-[#e5e5e5] hover:bg-[#ededed] rounded-[3px]"
                  style={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                  onClick={() => moveFoundIndex(1)}
                >
                  <IncMoveIndexIcon className="w-3 h-3"/>
                </button>
                <button className="flex justify-center items-center cursor-pointer text-gray-600 w-5 h-[22px] bg-[#e5e5e5] hover:bg-[#ededed] rounded-[3px]"
                  style={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }}
                  onClick={() => moveFoundIndex(-1)}
                >
                  <DecMoveIndexIcon className="w-3 h-3"/>
                </button>                 
              </div>
              <button className="flex justify-center items-center w-8 h-8 text-gray-500 hover:text-gray-700 cursor-pointer"
                onClick={() => setSearchStr("")}
              >
                <DeleteIcon className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

interface HeaderProps extends SearchProps { 
  fields: FieldsData, 
  viewData: ViewDetailedData
}
const Header = ({ fields, viewData, searchStr, setSearchStr, foundIndex, numSearchFound, moveFoundIndex } : HeaderProps) => {
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
          <ViewSearch searchStr={searchStr} setSearchStr={setSearchStr} foundIndex={foundIndex} numSearchFound={numSearchFound} moveFoundIndex={moveFoundIndex}/>
        </div>
      </div>
    </div>
  )
}
export default Header