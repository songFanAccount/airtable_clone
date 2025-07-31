import type { FieldData, FieldsData } from "../../../BasePage"
import { ImTextColor as TextTypeIcon } from "react-icons/im";
import { FaHashtag as NumberTypeIcon } from "react-icons/fa";
import { GoPlus as AddIcon } from "react-icons/go";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Popover from "@radix-ui/react-popover";
import { CheckIcon } from "@radix-ui/react-icons";
import { MdKeyboardArrowDown as DropdownIcon, MdOutlineModeEdit as RenameIcon } from "react-icons/md";
import { HiOutlineTrash as DeleteIcon } from "react-icons/hi";
import { FieldType } from "@prisma/client";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { toastTODO } from "~/hooks/helpers";

const FieldCell = ({ field, isFirst } : { field : FieldData, isFirst: boolean }) => {
  const [fieldHovered, setFieldHovered] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)
  const [isRenaming, setIsRenaming] = useState<boolean>(false)
  const TypeIcon = field.type === FieldType.Text ? TextTypeIcon : NumberTypeIcon
  const dim = field.type === FieldType.Text ? "16px" : "12px"
  const utils = api.useUtils()
  const { mutate: deleteField, status } = api.base.deleteField.useMutation({
    onSuccess: async () => {
      await utils.base.getAllFromBase.invalidate()
    }
  })
  function onDeleteField() {
    if (field) {
      deleteField({fieldId: field.id})
      setEditing(false)
    }
  }
  return (
    <Popover.Root open={editing} onOpenChange={setEditing}>
      <Popover.Anchor asChild>
        <div className="flex flex-row justify-between items-center w-[180px] h-full hover:bg-[#f8f8f8] cursor-default border-box border-r-[1px] px-2 bg-white"
          style={{
            borderColor: isFirst ? "#d1d1d1" : "#dfe2e4"
          }}
          onMouseEnter={() => setFieldHovered(true)}
          onMouseLeave={() => setFieldHovered(false)}
          onContextMenu={(e) => {e.preventDefault(); setEditing(true)}}
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
          {(fieldHovered || editing) && 
            <Popover.Trigger asChild>
              <button className="cursor-pointer">
                <DropdownIcon className="w-4 h-4"/>
              </button>
            </Popover.Trigger>
          }
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="start"
              className="bg-white rounded-[6px] z-50 relative top-1 left-1"
              style={{
                boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)",
                padding: isRenaming ? "16px" : "8px",
                width: isRenaming ? "280px" : "180px"
              }}
            >
              <div className="flex flex-col w-full text-gray-700 text-[13px]">
                <button className="flex flex-row items-center h-8 p-2 gap-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer"
                  onClick={() => toastTODO("Rename field")}
                >
                  <RenameIcon className="w-[14px] h-[14px]"/>
                  <span>Rename field</span>
                </button>
                <button className="flex flex-row items-center h-8 p-2 gap-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer"
                  onClick={onDeleteField}
                >
                  <DeleteIcon className="w-[14px] h-[14px]"/>
                  <span>Delete field</span>
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </div>
      </Popover.Anchor>
    </Popover.Root>
  )
}
const ColumnHeadings = ({ tableId, fields, selectAll, onCheck } : { tableId?: string, fields: FieldsData, selectAll: boolean, onCheck: () => void }) => {
  const [createOpen, setCreateOpen] = useState<boolean>(false)
  const [newFieldType, setNewFieldType] = useState<FieldType | undefined>(undefined)
  const [newFieldName, setNewFieldName] = useState<string>("")
  const utils = api.useUtils()
  const { mutate: createField, status } = api.base.addNewField.useMutation({
    onSuccess: async () => {
      await utils.base.getAllFromBase.invalidate()
    }
  })
  useEffect(() => {
    if (!createOpen) {
      setNewFieldName("")
      setNewFieldType(undefined)
    }
  }, [createOpen])
  function onCreateField() {
    if (status === "pending") return
    if (tableId && newFieldType && fields) {
      const fieldType = newFieldType === FieldType.Text ? "TEXT" : "NUMBER"
      let fieldName = newFieldName.trim()
      if (fieldName === "") {
        fieldName = newFieldType === FieldType.Text ? "Label" : "Number"
        if (fields.some(field => field?.name === fieldName)) {
          let fieldNameNum = 1
          while (fields.some(field => field?.name === `${fieldName} ${fieldNameNum}`)) {
            fieldNameNum++
          }
          fieldName = `${fieldName} ${fieldNameNum}`
        }
      }
      let columnNumber = 0
      for (const field of fields) {
        if (field?.columnNumber > columnNumber) columnNumber = field?.columnNumber
      }
      columnNumber++
      createField({ tableId: tableId, fieldName, fieldType, columnNumber })
      setNewFieldName("")
      setNewFieldType(undefined)
      setCreateOpen(false)
    }
  }
  return (
    <div className="flex flex-row items-center h-8 border-box border-b-[1px] bg-[#fbfcfe] font-[500]"
      style={{
        borderColor: "#d1d1d1"
      }}
    >
      <div className="w-[87px] h-full flex flex-row items-center pl-4 bg-white">
        <div className="flex items-center space-x-2">
          <Checkbox.Root
            checked={selectAll}
            onCheckedChange={onCheck}
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
      <Popover.Root
        open={createOpen}
        onOpenChange={setCreateOpen}
      >
        <Popover.Trigger asChild>
          <button className="h-full w-[94px] flex justify-center items-center border-box border-r-[1px] border-[#dfe2e4] bg-white hover:bg-[#f8f8f8] cursor-pointer"
            onClick={() => setCreateOpen(true)}
          >
            <AddIcon className="h-5 w-5"/>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            className="bg-white rounded-[6px] z-50 relative top-1 left-1"
            style={{
              boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)",
              padding: newFieldType ? "16px" : "8px",
              width: newFieldType ? "280px" : "180px"
            }}
          >
            {
              newFieldType
              ?
                <div className="flex flex-col w-full text-[13px] gap-4">
                  <input
                    value={newFieldName}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setNewFieldName(newValue)
                    }}
                    placeholder="Field name (optional)"
                    className="p-2 h-8 padding-box w-full rounded-[6px] placeholder:text-gray-600"
                    style={{
                      outline: "2px solid #eaeaea"
                    }}
                  />
                  <div className="flex flex-row justify-end items-center w-full h-8">
                    <div className="flex flex-row items-center gap-4 h-full">
                      <button className="cursor-pointer"
                        onClick={() => {
                          setNewFieldName("")
                          setNewFieldType(undefined)
                        }}
                      >
                        <span>Cancel</span>
                      </button>
                      <button className="text-white font-[500] bg-[#166ee1] h-full px-3 rounded-[6px] cursor-pointer"
                        onClick={onCreateField}
                      >
                        <span>Create field</span>
                      </button>
                    </div>
                  </div>
                </div>
              :
                <div className="flex flex-col w-full text-[13px]">
                  <button className="flex flex-row items-center w-full px-[10px] py-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer"
                    onClick={() => setNewFieldType(FieldType.Text)}
                  >
                    <div className="flex flex-row items-center gap-2">
                      <TextTypeIcon className="w-4 h-4"/>
                      <span>Single line text</span>
                    </div>
                  </button>
                  <button className="flex flex-row items-center w-full px-[10px] py-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer"
                    onClick={() => setNewFieldType(FieldType.Number)}
                  >
                    <div className="flex flex-row items-center gap-2">
                      <div className="flex justify-center items-center w-4 h-4">
                        <NumberTypeIcon className="w-3 h-3"/>
                      </div>
                      <span>Number</span>
                    </div>
                  </button>
                </div>
            }
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>  
    </div>
  )
}
export default ColumnHeadings