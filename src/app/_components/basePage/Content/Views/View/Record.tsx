import type { Prisma } from "@prisma/client"
import type { FieldData, FieldsData, RecordData } from "../../../BasePage"
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";

const Cell = ({ field, value, isFirst } : { field: FieldData, value: string | undefined, isFirst: boolean }) => {
  return (
    <div className="flex flex-row justify-between items-center w-[180px] h-full border-box border-r-[1px]"
      style={{
        borderColor: isFirst ? "#d1d1d1" : "#dfe2e4"
      }}
    >
      <span>{value}</span>
    </div>
  )
}

const Record = ({ fields, record, rowNum } : { fields: FieldsData, record: RecordData, rowNum: number }) => {
  const { id, data } = record
  const jsonData = data as Prisma.JsonObject
  const [isHovered, setIsHovered] = useState<boolean>(false)
  return (
    <div className="flex flex-row items center h-8 border-box border-b-[1px] bg-white hover:bg-[#f8f8f8] cursor-default"
      style={{
        borderColor: "#dfe2e4"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-[87px] h-full flex flex-row items-center pl-4 bg-white"
        style={{
          backgroundColor: isHovered ? "#f8f8f8" : undefined
        }}
      >
        <div className="flex items-center space-x-2">
          {
            isHovered
            ?
              <Checkbox.Root
                id="c1"
                className="w-4 h-4 mx-2 rounded border border-gray-300 flex items-center justify-center
                data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                >
                <Checkbox.Indicator>
                  <CheckIcon className="text-white w-4 h-4" />
                </Checkbox.Indicator>
              </Checkbox.Root>
            :
              <div className="w-4 h-4 flex justify-center items-center text-gray-600 mx-2">
                <span>{rowNum}</span>
              </div>
          }
        </div>
      </div>
      {fields?.map((field, index) => <Cell key={index} field={field} value={jsonData?.[field.id] as (string | undefined)} isFirst={index === 0}/>)}
    </div>
  )
}
export default Record