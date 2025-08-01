import type { FieldsData, RecordsData, TableData, ViewData } from "../../../BasePage"
import { GoPlus as AddIcon } from "react-icons/go";
import ColumnHeadings from "./ColumnHeadings"
import Record from "./Record"
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const View = ({ tableData, records, currentView } : { tableData: TableData, records: RecordsData, currentView: ViewData }) => {
  const fields: FieldsData = tableData?.fields
  if (fields) fields.sort((a, b) => a.columnNumber - b.columnNumber)
  if (records) records.sort((a, b) => a.position - b.position)
  const largestPosition = (records && records.length > 0 && records[records.length - 1]) ? records[records.length - 1]?.position : undefined
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState<boolean>(false)

  function onSelectAll() {
    const newSelectAll = !selectAll
    if (newSelectAll) {
      if (records) setSelectedRecords(new Set(Array.from({length: records.length}, (_, i) => i)))
    } else setSelectedRecords(new Set())
    setSelectAll(newSelectAll)
  }
  function checkRecord(i: number) {
    const newSelectedRecords = new Set(selectedRecords)
    if (newSelectedRecords.has(i)) {
      newSelectedRecords.delete(i)
      setSelectAll(false)
    } else newSelectedRecords.add(i)
    setSelectedRecords(newSelectedRecords)
  }
  const utils = api.useUtils()
  const { mutate: addRecord, status: addRecordStatus } = api.base.addNewRecord.useMutation({
    onSuccess: async (createdRecord) => {
      if (createdRecord) {
        toast.success(`Created new record!"`)
        await utils.base.getRecords.invalidate()
      }
    }
  })
  function onAddRecord() {
    if (addRecordStatus === "pending") return
    if (tableData && fields) addRecord({tableId: tableData.id, newPosition: Math.floor(largestPosition ?? 0) + 1, fieldIds: fields.map(field => field.id)})
  }
  const { mutate: add100kRecords, status: add100kRecordsStatus } = api.base.add100kRecords.useMutation({
    onSuccess: async (addEvent) => {
      toast.success(`Added ${addEvent.count} records!`)
      await utils.base.getRecords.invalidate()
    }
  })
  function onAdd100kRecords() {
    if (tableData) {
      add100kRecords({ tableId: tableData.id })
    }
  }
  const { mutate: deleteRecords, status: deleteStatus } = api.base.deleteRecords.useMutation({
    onSuccess: async (deleteInfo) => {
      toast.success(`Deleted ${deleteInfo.count} record${deleteInfo.count > 1 ? "s" : ""}!`)
      await utils.base.getRecords.invalidate()
    }
  })
  const [mainSelectedCell, setMainSelectedCell] = useState<[number, number] | undefined>(undefined)
  function onDeleteSelectedRecords(callIndex: number) {
    const deleteIndices = [...selectedRecords]
    if (!deleteIndices.includes(callIndex)) deleteIndices.push(callIndex)
    const deleteIds: string[] = []
    deleteIndices.forEach(deleteInd => {
      const record = records?.[deleteInd]
      if (record) deleteIds.push(record.id)
    })
    deleteRecords({ recordIds: deleteIds })
    setSelectedRecords(new Set())
    setSelectAll(false)
    setMainSelectedCell(undefined)
  }
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const popover = document.querySelector('[data-popover="true"]');
      if (ref.current && !ref.current.contains(event.target as Node) && !popover?.contains(event.target as Node)) {
        setMainSelectedCell(undefined)
        setSelectedRecords(new Set())
        setSelectAll(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    if (mainSelectedCell) {
      const selectedRowIndex = mainSelectedCell[0]
      if (!selectedRecords.has(selectedRowIndex)) {
        setSelectAll(false)
        setSelectedRecords(new Set())
      }
    }
  }, [mainSelectedCell])
  return (
    <div className="w-full h-full text-[13px] bg-[#f6f8fc]">
      <div ref={ref} className="flex flex-col w-full h-fit pb-16 max-h-full">
        <ColumnHeadings
          tableId={tableData?.id}
          fields={tableData?.fields}
          selectAll={selectAll}
          onCheck={onSelectAll}
        />
        <div className="flex h-fit flex-col w-full flex-1 relative overflow-y-auto">
          <div
            className="flex flex-col"
            style={{
              width: fields ? `${fields.length * 180 + 87}px` : undefined,
            }}
          >
            {records?.map((record, index) => (
              <Record
                key={index}
                fields={fields}
                record={record}
                recordSelected={selectedRecords.has(index)}
                onCheck={() => checkRecord(index)}
                rowNum={index + 1}
                mainSelectedCell={mainSelectedCell}
                setMainSelectedCell={setMainSelectedCell}
                multipleRecordsSelected={selectedRecords.size > 1}
                onDeleteRecord={() => {
                  if (deleteStatus === "pending") return;
                  onDeleteSelectedRecords(index);
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col sticky bottom-0 bg-white border-[#dfe2e4]"
          style={{
            width: fields ? `${fields.length * 180 + 87}px` : undefined,
            borderTopWidth: (records && records.length >= 40) ? "1px" : undefined
          }}
        >
          <button
            className="flex flex-row items-center w-full bg-white h-8 hover:bg-[#f2f4f8] cursor-pointer border-box border-b-[1px] border-r-[1px] disabled:cursor-not-allowed"
            style={{ borderColor: "#dfe2e4" }}
            onClick={onAddRecord}
            disabled={addRecordStatus === "pending"}
          >
            <div className="w-[87px] h-full flex flex-row items-center pl-4">
              <AddIcon className="w-5 h-5 text-gray-500 ml-[6px]" />
            </div>
            <div className="w-[180px] border-box border-r-[1px] h-full border-[#d1d1d1]" />
          </button>
          <button
            className="flex flex-row items-center w-full bg-white h-8 text-gray-500 hover:bg-[#f2f4f8] cursor-pointer border-box border-b-[1px] border-r-[1px] disabled:cursor-not-allowed"
            style={{ borderColor: "#dfe2e4" }}
            onClick={onAdd100kRecords}
            disabled={add100kRecordsStatus === "pending"}
          >
            <div className="w-[87px] h-full flex flex-row items-center pl-4">
              <AddIcon className="w-5 h-5 ml-[6px]" />
            </div>
            <div className="flex flex-row items-center w-[180px] border-box border-r-[1px] h-full border-[#d1d1d1]">
              <span>Add 100k rows</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
export default View