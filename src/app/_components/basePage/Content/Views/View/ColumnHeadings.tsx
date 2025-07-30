import type { FieldData, FieldsData } from "../../../BasePage"
import { ImTextColor as TextTypeIcon } from "react-icons/im";
import { FaHashtag as NumberTypeIcon } from "react-icons/fa";
import { GoPlus as AddIcon } from "react-icons/go";
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { FieldType } from "@prisma/client";
import { useState } from "react";

const FieldCell = ({ field, isFirst } : { field : FieldData, isFirst: boolean }) => {
  const [fieldHovered, setFieldHovered] = useState<boolean>(false)
  const TypeIcon = field.type === FieldType.Text ? TextTypeIcon : NumberTypeIcon
  const dim = field.type === FieldType.Text ? "16px" : "12px"
  return (
    <div className="flex flex-row justify-between items-center w-[180px] h-full hover:bg-[#f8f8f8] cursor-default border-box border-r-[1px] px-2 bg-white"
      style={{
        borderColor: isFirst ? "#d1d1d1" : "#dfe2e4"
      }}
      onMouseEnter={() => setFieldHovered(true)}
      onMouseLeave={() => setFieldHovered(false)}
    >
      <div className="flex flex-row items-center gap-1">
        <TypeIcon className=""
          style={{
            width: dim,
            height: dim,
          }}
          />
        <span>{field.name}</span>
      </div>
      {fieldHovered && 
        <button className="cursor-pointer">
          <DropdownIcon className="w-4 h-4"/>
        </button>
      }
    </div>
  )
}
const ColumnHeadings = ({ fields } : { fields: FieldsData }) => {
  return (
    <div className="flex flex-row items-center h-8 border-box border-b-[1px] bg-[#fbfcfe] font-[500]"
      style={{
        borderColor: "#d1d1d1"
      }}
    >
      <div className="w-[87px] h-full flex flex-row items-center pl-4 bg-white">
        <div className="flex items-center space-x-2">
          <Checkbox.Root
            id="c1"
            className="w-4 h-4 mx-2 rounded border border-gray-300 flex items-center justify-center
                      data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          >
            <Checkbox.Indicator>
              <CheckIcon className="text-white w-4 h-4" />
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
      </div>
      {
        fields?.map((field, index) => <FieldCell key={index} field={field} isFirst={index === 0}/>)
      }
      <button className="h-full w-[94px] flex justify-center items-center border-box border-r-[1px] border-[#dfe2e4] bg-white hover:bg-[#f8f8f8] cursor-pointer">
        <AddIcon className="h-5 w-5"/>
      </button>
    </div>
  )
}
export default ColumnHeadings