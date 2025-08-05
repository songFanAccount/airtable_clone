import { type RecordsData, type FieldsData, type TableData, type ViewDetailedData, type CellData } from "../../../BasePage"
import { GoPlus as AddIcon } from "react-icons/go";
import { Loader2 as LoadingIcon } from "lucide-react";
import ColumnHeadings from "./ColumnHeadings"
import Record from "./Record"
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useVirtualizer } from '@tanstack/react-virtual'
import { keepPreviousData } from "@tanstack/react-query";
import { FilterOperator } from "@prisma/client";

const View = ({ tableData, view, foundIndex, foundCells } : { tableData: TableData, view: ViewDetailedData, searchStr: string, foundIndex: number, foundCells: CellData[] }) => {
  const utils = api.useUtils()
  const fields: FieldsData = tableData?.fields
  const includedFields: FieldsData = fields?.filter(field => !view?.hiddenFieldIds.includes(field.id))
  const [totalNumRows, setTotalNumRows] = useState<number>(0)
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
  const { data: recordsObj, isFetching } = api.base.getRecords.useQuery({ viewId: view?.id ?? "", skip: startIndex, take: endIndex - startIndex + 1 }, {
    enabled: !!tableData?.id && !!view?.id,
    placeholderData: keepPreviousData
  })
  useEffect(() => {
    if (view) {
      void utils.base.getRecords.invalidate();
    }
  }, [view, utils, tableData?.id]);
  const records = recordsObj?.records
  const viewNumRecords = recordsObj?.totalRecordsInView
  useEffect(() => {
    if (viewNumRecords !== undefined) {
      setTotalNumRows(viewNumRecords)
    }
  }, [viewNumRecords])
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
    onSuccess: async () => {
      toast.success(`Created new record!"`)
      await utils.base.getAllFromBase.invalidate()
      await utils.base.getRecords.invalidate()
    }
  })
  function onAddRecord() {
    if (addRecordStatus === "pending") return
    if (tableData && fields) addRecord({tableId: tableData.id})
  }
  const { mutate: addXRecords, status: addXRecordsStatus } = api.base.addXRecords.useMutation({
    onSuccess: async (addEvent) => {
      toast.success(`Added ${addEvent.count} records!`)
      await utils.base.getAllFromBase.invalidate()
      await utils.base.getRecords.invalidate()
    }
  })
  const xs = [10, 100, 100000, 1000000]
  const xsStr = ["10", "100", "100k", "1 mil"]
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
  const headingsRef = useRef<HTMLDivElement>(null)
  const recordRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const popover = document.querySelector('[data-popover="true"]');
      if (recordRef.current && headingsRef.current && !recordRef.current.contains(event.target as Node) && !headingsRef.current.contains(event.target as Node) && !popover?.contains(event.target as Node)) {
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
  const filtersActive = view?.filters?.filter(filter => {
    if (filter.operator === FilterOperator.EMPTY || filter.operator === FilterOperator.NOTEMPTY) return true
    else return filter.compareVal !== ""
  }).map(filter => fields?.find(field => filter.fieldId === field.id)?.id ?? "") ?? []
  const activeFilterFieldIds = [...new Set(filtersActive)]
  const sortedFieldIds = view?.sorts.map(sort => sort.fieldId) ?? []
  const recordMappedFoundCells: Record<string, CellData[]> = {}
  foundCells.forEach(cell => {
    if (recordMappedFoundCells.hasOwnProperty(cell.recordId)) recordMappedFoundCells[cell.recordId]?.push(cell)
    else recordMappedFoundCells[cell.recordId] = [cell]
  })
  const bottomMsg = isFetching ? "Fetching rows..." : `Total: ${totalNumRows}. Loaded: ${startIndex+1} - ${endIndex+1}. Num fetches: ${numFetches}`
  return (
    <div className="w-full h-full text-[13px] bg-[#f6f8fc]">
      <div className="flex flex-col h-full w-full pb-19 relative">
        <div ref={headingsRef}>
          <ColumnHeadings
            tableId={tableData?.id}
            fields={includedFields}
            selectAll={selectAll}
            onCheck={onSelectAll}
            activeFilterFieldIds={activeFilterFieldIds}
            sortedFieldIds={sortedFieldIds}
          />
        </div>
        <div ref={ref} className="max-h-full overflow-y-auto relative">
          <div className="flex flex-row w-full relative"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            <div
              ref={recordRef}
              className="flex flex-col absolute top-0 h-fit"
              style={{
                width: includedFields ? `${includedFields.length * 180 + 87}px` : undefined,
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
                      record && fields
                      ?
                        <Record
                          fields={includedFields}
                          activeFilterFieldIds={activeFilterFieldIds}
                          sortedFieldIds={sortedFieldIds}
                          record={record}
                          foundCells={recordMappedFoundCells[record.id]}
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
                            includedFields?.map((_, index) => (
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
        {
          tableData && view && includedFields && includedFields.length > 0 &&
          <div className="flex flex-col sticky bottom-0 border-[#dfe2e4]"
            style={{
              width: includedFields ? `${includedFields.length * 180 + 87}px` : undefined,
              borderTopWidth: (records && records.length >= 40) ? "1px" : undefined
            }}
          >
            <button
              className="flex flex-row items-center w-full bg-white text-gray-500 h-8 hover:bg-[#f2f4f8] cursor-pointer border-box border-b-[1px] border-r-[1px] disabled:cursor-not-allowed"
              style={{ borderColor: "#dfe2e4" }}
              onClick={onAddRecord}
              disabled={addRecordStatus === "pending"}
            >
              <div className="min-w-[87px] w-[87px] h-full flex flex-row items-center pl-4">
                <AddIcon className="w-5 h-5 ml-[6px]" />
              </div>
              <div className="flex flex-row items-center min-w-[180px] w-[180px] border-box border-r-[1px] h-full border-[#d1d1d1]">
                <span className="mx-[6px]">Add one empty row</span>
              </div>
              <div className="ml-[6px] flex flex-row items-center gap-2 truncate">
                {
                  isFetching &&
                  <div className="flex flex-row items-center h-full flex-shrink-0">
                    <LoadingIcon className="w-4 h-4 animate-spin"/>
                  </div>
                }
                <span className="flex-1 truncate pr-[6px]">
                  {bottomMsg}
                </span>
              </div>
            </button>
            <div
              className="flex flex-row items-center w-full bg-white h-8 text-gray-500 border-box border-b-[1px]"
              style={{ borderColor: "#dfe2e4" }}
              >
              <div className="w-[87px] h-full flex flex-row items-center pl-4">
                <AddIcon className="w-5 h-5 ml-[6px]" />
              </div>
              {
                xs.map((x, index) => (
                  <button key={index} className="flex flex-row items-center border-box border-r-[1px] h-full border-[#d1d1d1] hover:bg-[#f2f4f8] cursor-pointer disabled:cursor-not-allowed"
                    disabled={addXRecordsStatus === "pending"}
                    onClick={() => onAddXRecords(x)}
                    style={{
                      flex: index === 0 ? undefined : 1,
                      width: index === 0 ? "180px" : undefined
                    }}
                  >
                    <span className="truncate mx-[6px]">{includedFields && includedFields.length > 2 ? `Add ${xsStr[index]} rows` : `${xsStr[index]}`}</span>
                  </button>
                ))
              }
            </div>
          </div>
        }
      </div>
    </div>
  )
}
export default View