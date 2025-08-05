import { FieldType } from "@prisma/client"
import type { CellData, FieldData, FieldsData, RecordData } from "../../../BasePage"
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Popover from "@radix-ui/react-popover";
import { CheckIcon } from "@radix-ui/react-icons";
import { HiOutlineTrash as DeleteIcon } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

function isNumber(str: string): boolean {
  return /^[0-9]+(\.[0-9]+)?$/.test(str);
}
interface CellProps {
  cell?: CellData, 
  field: FieldData,
  mainSelectedCell?: [number,number], 
  isFirst: boolean, 
  isSelected: boolean, 
  isSelectedRow: boolean,
  isFiltered: boolean,
  isSortedBy: boolean,
  onClick: () => void, 
  onCellChange: (cellId: string, newValue: string) => void,
  multipleRecordsSelected: boolean,
  onDelete: () => void,
  onTab: (direction: -1 | 1) => void
}
const Cell = ({ cell, field, mainSelectedCell, isFirst, isSelected, isSelectedRow, isFiltered, isSortedBy, onClick, onCellChange, multipleRecordsSelected, onDelete, onTab } : CellProps) => {
  const value = cell?.value
  const [actionsOpen, setActionsOpen] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)
  const [newValue, setNewValue] = useState<string>(value ?? "")
  useEffect(() => {
    setNewValue(value ?? "")
  }, [value])
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!cell) return
    const newValue = e.target.value
    const ok = field.type === FieldType.Text || (field.type === FieldType.Number && isNumber(newValue))
    if (ok) {
      setNewValue(newValue)
      onCellChange(cell.id, newValue)
    }
  }
  function onKeyDown(event: KeyboardEvent)  {
    const key = event.key
    if (isSelected && key === "Tab") {
      event.preventDefault()
      if (inputRef.current) inputRef.current.blur()
      setEditing(false)
      const direction = event.shiftKey ? -1 : 1
      onTab(direction)
    }
    if (editing || !isSelected) return
    const ok = field.type === FieldType.Text || (field.type === FieldType.Number && isNumber(key))
    if (key.length === 1 && ok) {
      setEditing(true)
      setNewValue("")
    }
  }
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isSelected, editing, setEditing, setNewValue])
  return (
    <Popover.Root open={actionsOpen} onOpenChange={setActionsOpen}>
      <Popover.Anchor asChild>
        <div className="relative flex flex-row justify-between items-center hover:[background-color:var(--hover-color)!important] w-[180px] h-full"
          style={{
            backgroundColor:
              isFiltered
                ? isSelectedRow ? "#e2f1e3" : "#ebfbec"
                : isSortedBy
                  ? isSelectedRow ? "#f5e9e1" : "#fff2ea"
                  : isSelected ? "white" : undefined,
            '--hover-color': isFiltered ? "#e2f1e3" : isSortedBy ? "#f5e9e1" : undefined,
            borderRight: 
              isSelected 
              ?
                isFirst ? "1px solid #d1d1d1" : "2px solid #166ee1"
              :  
                isFirst ? "1px solid #d1d1d1" : "1px solid #dfe2e4",
            borderLeft: isSelected && mainSelectedCell?.[1] !== 1 ? "2px solid #166ee1" : undefined,
            borderBottom: isSelected ? "2px solid #166ee1" : undefined,
            borderTop: (isSelected && mainSelectedCell?.[0] !== 0) ? "2px solid #166ee1" : undefined,
          } as React.CSSProperties}
          onClick={onClick}
          onDoubleClick={() => {if (!editing) setEditing(true)}}
          onContextMenu={(e) => {e.preventDefault(); onClick(); setActionsOpen(true)}}
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
              color: "rgb(29, 31, 37)",
              textAlign: field && field.type === FieldType.Text ? "start" : "end"
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
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          className="bg-white rounded-[6px] z-50 relative top-1 left-1"
          style={{
            boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)",
            padding: "8px",
            width: multipleRecordsSelected ? "240px" : "180px"
          }}
          data-popover="true"
        >
          <div className="flex flex-col w-full text-gray-700 text-[13px]">
            <button className="flex flex-row items-center h-8 p-2 gap-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer"
              onClick={() => {onDelete(); setActionsOpen(false)}}
            >
              <DeleteIcon className="w-[14px] h-[14px]"/>
              <span>{`Delete ${multipleRecordsSelected ? "all selected records" : "record"}`}</span>
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

interface RecordProps {
  fields: FieldsData,
  activeFilterFieldIds: string[],
  sortedFieldIds: string[],
  record: RecordData, 
  recordSelected: boolean, 
  onCheck: () => void, 
  rowNum: number, 
  mainSelectedCell?: [number, number], 
  setMainSelectedCell: (cell?: [number,number]) => void,
  multipleRecordsSelected: boolean,
  onDeleteRecord: () => void
}
const Record = ({ fields, activeFilterFieldIds, sortedFieldIds, record, recordSelected, onCheck, rowNum, mainSelectedCell, setMainSelectedCell, multipleRecordsSelected, onDeleteRecord } : RecordProps) => {
  const { cells } = record
  const [recordData, setRecordData] = useState<CellData[]>(cells)
  useEffect(() => {
    setRecordData(cells)
  }, [cells])
  const isSelectedRow = mainSelectedCell !== undefined && mainSelectedCell[0] === rowNum - 1
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const active = isHovered || isSelectedRow || recordSelected
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const utils = api.useUtils()
  const { mutate: updateCell } = api.base.updateCell.useMutation({
    onSuccess: async (updatedCell) => {
      if (activeFilterFieldIds.includes(updatedCell.fieldId) || sortedFieldIds.includes(updatedCell.fieldId)) {
        await utils.base.getRecords.invalidate()
      }
    }
  })
  function onRecordChange(cellId: string, newValue: string, type: FieldType) {
    if (timer) clearTimeout(timer)
    const newTimer = setTimeout(() => {
      updateCell({cellId, newValue, type})
    }, 1000)
    setTimer(newTimer)
  }
  function onTab(direction: -1 | 1) {
    if (mainSelectedCell) {
      const numFields = cells.length
      const colIndex = mainSelectedCell[1]
      const canMove = direction === 1 ? colIndex < numFields - 1 : colIndex > 0
      if (canMove) setMainSelectedCell([mainSelectedCell[0], colIndex + direction])
    }
  }
  return (
    <div className="flex flex-row items center h-8 border-box border-b-[1px] cursor-default"
      style={{
        borderColor: "#dfe2e4",
        backgroundColor: active ? "#f8f8f8" : "white"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-[87px] h-full flex flex-row items-center pl-4 bg-white"
        style={{
          backgroundColor: active ? "#f8f8f8" : undefined
        }}
      >
        <div className="flex items-center space-x-2">
          {
            active
            ?
              <Checkbox.Root
                id="c1"
                className="w-4 h-4 mx-2 rounded border border-gray-300 flex items-center justify-center
                data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                checked={recordSelected}
                onCheckedChange={onCheck}
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
          key={index}
          isFiltered={activeFilterFieldIds.includes(field.id)}
          isSortedBy={sortedFieldIds.includes(field.id)}
          cell={recordData?.find(cell => cell.fieldId === field.id)}
          field={field}
          mainSelectedCell={mainSelectedCell} 
          isFirst={index === 0}
          isSelected={isSelectedRow && mainSelectedCell[1] === index}
          isSelectedRow={isSelectedRow}
          onClick={() => setMainSelectedCell([rowNum-1, index])}
          onCellChange={(cellId: string, newValue: string) => onRecordChange(cellId, newValue, field.type)}
          multipleRecordsSelected={multipleRecordsSelected}
          onDelete={() => {onDeleteRecord(); setIsHovered(false);}}
          onTab={onTab}
        />
      )}
    </div>
  )
}
export default Record