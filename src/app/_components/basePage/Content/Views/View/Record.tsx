import type { Prisma } from "@prisma/client"
import type { FieldData, FieldsData, RecordData } from "../../../BasePage"
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

const Cell = ({ field, value, mainSelectedCell, isFirst, isSelected, onClick, onCellChange } : { field: FieldData, value: string | undefined, mainSelectedCell?: [number,number], isFirst: boolean, isSelected: boolean, onClick: () => void, onCellChange: (newValue: string) => void }) => {
  const [editing, setEditing] = useState<boolean>(false)
  const [newValue, setNewValue] = useState<string>(value ?? "")
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setNewValue(newValue)
    onCellChange(newValue)
  }
  return (
    <div className="relative flex flex-row justify-between items-center w-[180px] h-full"
      style={{
        backgroundColor: isSelected ? "white" : undefined,
        borderRight: 
          isSelected 
          ?
            isFirst ? "1px solid #d1d1d1" : "2px solid #166ee1"
          :  
            isFirst ? "1px solid #d1d1d1" : "1px solid #dfe2e4",
        borderLeft: isSelected && mainSelectedCell?.[1] !== 1 ? "2px solid #166ee1" : undefined,
        borderBottom: isSelected ? "2px solid #166ee1" : undefined,
        borderTop: (isSelected && mainSelectedCell?.[0] !== 0) ? "2px solid #166ee1" : undefined,
      }}
      onClick={onClick}
      onDoubleClick={() => {if (!editing) setEditing(true)}}
    >
      <input
        ref={inputRef}
        type="text"
        value={newValue}
        tabIndex={-1}
        autoFocus={false}
        onFocus={(e) => {
          if (!editing) e.target.blur()
        }}
        onChange={handleChange}
        onBlur={() => {
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-full outline-none p-[6px]"
        style={{
          cursor: editing ? "text" : "default",
          color: "rgb(29, 31, 37)"
        }}
      />
      {
        isSelected && !editing &&
        <div className="absolute w-[8px] h-[8px] border-box border-[1px] bg-white z-50"
          style={{
            borderColor: "rgb(22, 110, 225)",
            right: isSelected ? isFirst ? "-5px" : "-6px" : "-5px",
            bottom: isSelected ? "-6px" : "-4px"
          }}
        />
      }
    </div>
  )
}

const Record = ({ fields, record, rowNum, mainSelectedCell, setMainSelectedCell } : { fields: FieldsData, record: RecordData, rowNum: number, mainSelectedCell?: [number, number], setMainSelectedCell: (cell?: [number,number]) => void }) => {
  const { id, data } = record
  const jsonData = data as Prisma.JsonObject
  const isSelectedRow = mainSelectedCell !== undefined && mainSelectedCell[0] === rowNum - 1
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const { mutate: updateRecord } = api.base.updateRecord.useMutation()
  function onRecordChange(fieldId: string, newValue: string) {
    if (timer) clearTimeout(timer)
    const newTimer = setTimeout(() => {
      const newRecordData: Record<string, string> = jsonData as Record<string, string>
      newRecordData[fieldId] = newValue
      console.log(newRecordData)
      updateRecord({recordId: id, newRecordData})
    }, 1000)
    setTimer(newTimer)
  }
  return (
    <div className="flex flex-row items center h-8 border-box border-b-[1px] cursor-default"
      style={{
        borderColor: "#dfe2e4",
        backgroundColor: isHovered || isSelectedRow ? "#f8f8f8" : "white"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-[87px] h-full flex flex-row items-center pl-4 bg-white"
        style={{
          backgroundColor: isHovered || isSelectedRow ? "#f8f8f8" : undefined
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
      {fields?.map((field, index) => 
        <Cell 
          key={index} field={field} 
          value={jsonData?.[field.id] as (string | undefined)} 
          mainSelectedCell={mainSelectedCell} 
          isFirst={index === 0}
          isSelected={isSelectedRow && mainSelectedCell[1] === index} 
          onClick={() => setMainSelectedCell([rowNum-1, index])}
          onCellChange={(newValue: string) => onRecordChange(field.id, newValue)}
        />
      )}
    </div>
  )
}
export default Record