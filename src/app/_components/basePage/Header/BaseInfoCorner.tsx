import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";

const BaseInfoCorner = ({ baseName } : { baseName: string }) => {
  return (
    <div className="flex flex-row gap-2 items-center pl-4">
      <div className="w-[32px] h-[32px] flex justify-center items-center bg-[#99455a] rounded-[6px]">
        <img
          src="/assets/airtable_base.svg"
          alt="Airtable Base"
          className="w-[20px] h-[20px] filter invert"
        />
      </div>
      <div className="max-w-[480px]">
        <button className="flex flex-row items-center cursor-pointer max-w-full">
          <span className="text-[17px] font-[675] truncate">{baseName}</span>
          <DropdownIcon className="w-4 h-4 ml-1 text-gray-700 flex-shrink-0"/>
        </button>
      </div>
    </div>
  )
}
export default BaseInfoCorner