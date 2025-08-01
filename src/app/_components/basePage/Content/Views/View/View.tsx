import { type RecordsData, type FieldsData, type TableData, type ViewData } from "../../../BasePage"
import { GoPlus as AddIcon } from "react-icons/go";
import { Loader2 as LoadingIcon } from "lucide-react";
import ColumnHeadings from "./ColumnHeadings"
import Record from "./Record"
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useVirtualizer } from '@tanstack/react-virtual'
import { keepPreviousData } from "@tanstack/react-query";

const View = ({ tableData, currentView } : { tableData: TableData, currentView: ViewData }) => {
  const utils = api.useUtils()
  const fields: FieldsData = tableData?.fields
  if (fields) fields.sort((a, b) => a.columnNumber - b.columnNumber)
  const [totalNumRows, setTotalNumRows] = useState<number>(tableData?.recordCount ?? 0)
  useEffect(() => {
    setTotalNumRows(tableData?.recordCount ?? 0)
  }, [tableData])
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set())
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState<boolean>(false)
  const rowVirtualizer = useVirtualizer({
    count: totalNumRows,
    getScrollElement: () => ref.current,
    estimateSize: () => 32,
    overscan: 100
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const startIndex = virtualRows[0]?.index ?? 0
  const endIndex = virtualRows[virtualRows.length - 1]?.index ?? 0
  const [numFetches, setNumFetches] = useState<number>(0)
  const { data: records, isFetching } = api.base.getRecords.useQuery({ tableId: tableData?.id ?? "", skip: startIndex, take: endIndex - startIndex + 1 }, {
    enabled: !!tableData?.id,
    placeholderData: keepPreviousData
  })
  interface Cache {
    data: RecordsData,
    startIndex: number,
    endIndex: number
  }
  const [recordsCache, setRecordsCache] = useState<Cache | undefined>(undefined)
  useEffect(() => {
    if (isFetching === false) {
      setRecordsCache({
        data: records,
        startIndex,
        endIndex
      })
      setNumFetches(numFetches+1)
    }
  }, [isFetching, records, startIndex, endIndex])
  function onSelectAll() {
    const newSelectAll = !selectAll
    if (newSelectAll) {
      if (records) setSelectedRecords(new Set(Array.from({length: records.length}, (_, i) => i)))
    } else setSelectedRecords(new Set())
    setSelectAll(newSelectAll)
  }
  function checkRecord(i: number, recordId: string) {
    const newSelectedRecords = new Set(selectedRecords)
    if (newSelectedRecords.has(i)) {
      newSelectedRecords.delete(i)
      setSelectAll(false)
    } else newSelectedRecords.add(i)
    setSelectedRecords(newSelectedRecords)
    const newSelectedRecordIds = new Set(selectedRecordIds)
    if (newSelectedRecordIds.has(recordId)) {
      newSelectedRecordIds.delete(recordId)
    } else newSelectedRecordIds.add(recordId)
    setSelectedRecordIds(newSelectedRecordIds)
  }
  const { mutate: addRecord, status: addRecordStatus } = api.base.addNewRecord.useMutation({
    onSuccess: async (createdRecord) => {
      if (createdRecord) {
        toast.success(`Created new record!"`)
        await utils.base.getAllFromBase.invalidate()
        await utils.base.getRecords.invalidate()
      }
    }
  })
  function onAddRecord() {
    if (addRecordStatus === "pending") return
    if (tableData && fields) addRecord({tableId: tableData.id, fieldIds: fields.map(field => field.id)})
  }
  const { mutate: addXRecords, status: addXRecordsStatus } = api.base.addXRecords.useMutation({
    onSuccess: async (addEvent) => {
      toast.success(`Added ${addEvent.count} records!`)
      await utils.base.getAllFromBase.invalidate()
      await utils.base.getRecords.invalidate()
    }
  })
  const xs = [10, 100, 100000, 1000000]
  const xsStr = ["10", "100", "100k", "1mil"]
  function onAddXRecords(x: number) {
    if (addXRecordsStatus === "pending") return
    if (totalNumRows + x > 1500000) {
      toast.error(`Row limit capped at 1.5mil, this action would exceed this cap!`)
      return
    }
    if (tableData) {
      addXRecords({ tableId: tableData.id, numRecords: x })
    }
  }
  const { mutate: deleteRecords, status: deleteStatus } = api.base.deleteRecords.useMutation({
    onSuccess: async (deleteInfo) => {
      toast.success(`Deleted ${deleteInfo.count} record${deleteInfo.count > 1 ? "s" : ""}!`)
      await utils.base.getAllFromBase.invalidate()
      await utils.base.getRecords.invalidate()
    }
  })
  const [mainSelectedCell, setMainSelectedCell] = useState<[number, number] | undefined>(undefined)
  function onDeleteSelectedRecords(callId: string) {
    if (tableData) {
      const deleteIds = [...selectedRecordIds]
      if (!deleteIds.includes(callId)) deleteIds.push(callId)
      deleteRecords({ tableId: tableData.id, recordIds: deleteIds })
      setSelectedRecords(new Set())
      setSelectAll(false)
      setMainSelectedCell(undefined)
    }
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
  const bottomMsg = isFetching ? "Fetching rows..." : `Total rows: ${totalNumRows}. Loaded rows: ${startIndex+1} - ${endIndex}. Num fetches: ${numFetches}`
  return (
    <div className="w-full h-full text-[13px] bg-[#f6f8fc]">
      <div className="flex flex-col h-full w-full pb-16 relative" 
        
      >
        <ColumnHeadings
          tableId={tableData?.id}
          fields={tableData?.fields}
          selectAll={selectAll}
          onCheck={onSelectAll}
        />
        <div ref={ref} className="max-h-full overflow-y-auto relative">
          <div className="flex flex-col w-full relative"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            <div
              className="flex flex-col absolute top-0 h-fit"
              style={{
                width: fields ? `${fields.length * 180 + 87}px` : undefined,
              }}
            >
              {virtualRows.map((virtualRow) => {
                const absoluteIndex = virtualRow.index
                const record = (isFetching && recordsCache) ? recordsCache.data?.[absoluteIndex - recordsCache.startIndex] : records?.[absoluteIndex - startIndex]
                return (
                  <div
                    key={`row-${absoluteIndex}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      height: virtualRow.size,
                      width: "100%"
                    }}
                  >
                    {
                      record
                      ?
                        <Record
                          fields={fields}
                          record={record}
                          recordSelected={selectedRecords.has(absoluteIndex)}
                          onCheck={() => checkRecord(absoluteIndex, record.id)}
                          rowNum={absoluteIndex + 1}
                          mainSelectedCell={mainSelectedCell}
                          setMainSelectedCell={setMainSelectedCell}
                          multipleRecordsSelected={selectedRecords.size > 1}
                          onDeleteRecord={() => {
                            if (deleteStatus === "pending") return;
                            onDeleteSelectedRecords(record.id);
                          }}
                        />
                      :
                        <div className="flex flex-row items center h-8 bg-gray-100 border-box border-b-[1px] cursor-default"
                          style={{
                            borderColor: "#dfe2e4",
                          }}
                        >
                          <div className="flex flex-row items-center text-gray-600 w-[87px] pl-4">
                            <span className="w-8 h-8 flex justify-center items-center">{absoluteIndex+1}</span>
                          </div>
                          {
                            fields?.map((_, index) => (
                              <div
                                key={index}
                                className="w-[180px] h-8 border-r-[1px] border-[#dfe2e4] border-box"
                              />
                            ))
                          }
                        </div>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col sticky bottom-0 border-[#dfe2e4]"
          style={{
            width: fields ? `${fields.length * 180 + 87}px` : undefined,
            borderTopWidth: (records && records.length >= 40) ? "1px" : undefined
          }}
        >
          <button
            className="flex flex-row items-center w-full bg-white text-gray-500 h-8 hover:bg-[#f2f4f8] cursor-pointer border-box border-b-[1px] border-r-[1px] disabled:cursor-not-allowed"
            style={{ borderColor: "#dfe2e4" }}
            onClick={onAddRecord}
            disabled={addRecordStatus === "pending"}
          >
            <div className="w-[87px] h-full flex flex-row items-center pl-4">
              <AddIcon className="w-5 h-5 ml-[6px]" />
            </div>
            <div className="flex flex-row items-center w-[180px] border-box border-r-[1px] h-full border-[#d1d1d1]">
            {
              (records && records.length >= 40) &&
              <span className="mx-[6px]">Add one empty row</span>
            }
            </div>
            <div className="ml-3 flex flex-row items-center gap-2">
              {
                isFetching &&
                <div className="flex flex-row items-center h-full flex-shrink-0">
                  <LoadingIcon className="w-4 h-4 animate-spin"/>
                </div>
              }
              <span>
                {bottomMsg}
              </span>
            </div>
          </button>
          {/* <div className="bg-[#f6f8fc]"> */}
            <div
              className="flex flex-row items-center w-full bg-white h-8 text-gray-500 border-box border-b-[1px]"
              style={{ borderColor: "#dfe2e4" }}
              >
              <div className="w-[87px] h-full flex flex-row items-center pl-4">
                <AddIcon className="w-5 h-5 ml-[6px]" />
              </div>
              {
                xs.map((x, index) => (
                  <button key={index} className="flex flex-row items-center flex-1 border-box border-r-[1px] h-full border-[#d1d1d1] hover:bg-[#f2f4f8] cursor-pointer disabled:cursor-not-allowed"
                    disabled={addXRecordsStatus === "pending"}
                    onClick={() => onAddXRecords(x)}
                  >
                    <span className="mx-[6px]">Add {xsStr[index]} rows</span>
                  </button>
                ))
              }
            </div>
          {/* </div> */}
        </div>
      </div>
    </div>
  )
}
export default View