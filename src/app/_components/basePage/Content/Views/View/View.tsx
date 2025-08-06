import { type RecordsData, type FieldsData, type TableData, type ViewDetailedData, type CellData, type RecordData } from "../../../BasePage"
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
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef
} from '@tanstack/react-table'

const View = ({ tableData, view, searchStr, foundIndex, foundRecords }: { tableData: TableData, view: ViewDetailedData, searchStr: string, foundIndex?: number, foundRecords: RecordsData }) => {
  const utils = api.useUtils()
  const fields: FieldsData = tableData?.fields
  const includedFields: FieldsData = fields?.filter(field => !view?.hiddenFieldIds.includes(field.id))
  const [totalNumRows, setTotalNumRows] = useState<number>(0)

  // Virtualization
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
  const { data: recordsObj, isFetching } = api.base.getRecords.useQuery(
    { viewId: view?.id ?? "", skip: startIndex, take: endIndex - startIndex + 1 },
    { enabled: !!tableData?.id && !!view?.id, placeholderData: keepPreviousData }
  )

  useEffect(() => {
    if (view) void utils.base.getRecords.invalidate();
  }, [view, utils, tableData?.id]);

  const records = recordsObj?.records
  const viewNumRecords = recordsObj?.totalRecordsInView
  useEffect(() => {
    if (viewNumRecords !== undefined) {
      setTotalNumRows(viewNumRecords)
    }
  }, [viewNumRecords])

  // Cache last fetched data for better scrolling
  interface Cache { data: RecordsData, startIndex: number, endIndex: number }
  const [recordsCache, setRecordsCache] = useState<Cache | undefined>(undefined)
  useEffect(() => {
    if (!isFetching) {
      setRecordsCache({ data: records, startIndex, endIndex })
      setNumFetches(numFetches + 1)
    }
  }, [isFetching, records, startIndex, endIndex])

  // Table setup
  const [rowSelection, setRowSelection] = useState({})
  const columns: ColumnDef<RecordData>[] = includedFields?.map(field => ({
    id: field.id,
    header: field.name,
    accessorFn: row => row.cells.find(cell => cell.fieldId === field.id)?.value ?? "",
    meta: field
  })) ?? []

  const table = useReactTable({
    data: records ?? [],
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const { mutate: addRecord, status: addRecordStatus } = api.base.addNewRecord.useMutation({
    onSuccess: async () => {
      toast.success(`Created new record!"`)
      await utils.base.getAllFromBase.invalidate()
      await utils.base.getRecords.invalidate()
    }
  })
  function onAddRecord() {
    if (addRecordStatus === "pending") return
    if (tableData && fields) addRecord({ tableId: tableData.id })
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
    if (tableData) addXRecords({ tableId: tableData.id, numRecords: x })
  }

  const { mutate: deleteRecords, status: deleteStatus } = api.base.deleteRecords.useMutation({
    onSuccess: async (deleteInfo) => {
      toast.success(`Deleted ${deleteInfo.count} record${deleteInfo.count > 1 ? "s" : ""}!`)
      await utils.base.getAllFromBase.invalidate()
      await utils.base.getRecords.invalidate()
    }
  })
  function onDeleteSelectedRecords(callId?: string) {
    if (!tableData) return
    const selectedIds = callId ? [callId] : table.getSelectedRowModel().rows.map(r => r.original.id)
    deleteRecords({ tableId: tableData.id, recordIds: selectedIds })
  }

  // Refs and filters
  const ref = useRef<HTMLDivElement>(null);
  const headingsRef = useRef<HTMLDivElement>(null)
  const recordRef = useRef<HTMLDivElement>(null)

  const filtersActive = view?.filters?.filter(filter => {
    if (filter.operator === FilterOperator.EMPTY || filter.operator === FilterOperator.NOTEMPTY) return true
    return filter.compareVal !== ""
  }).map(filter => fields?.find(field => filter.fieldId === field.id)?.id ?? "") ?? []
  const activeFilterFieldIds = [...new Set(filtersActive)]
  const sortedFieldIds = view?.sorts.map(sort => sort.fieldId) ?? []
  const [mainSelectedCell, setMainSelectedCell] = useState<[number, number] | undefined>(undefined)
  // Search handling
  const currentCellRef = useRef<{recordIndex: number, record: RecordData, cellIndex: number, lastFoundIndex: number} | undefined>(undefined)
  const [currentCell, setCurrentCell] = useState<CellData | undefined>(undefined)
  useEffect(() => {
    currentCellRef.current = undefined
  }, [searchStr])
  useEffect(() => {
    if (!foundRecords || foundRecords?.length === 0) {
      setCurrentCell(undefined)
      currentCellRef.current = undefined
      return
    }
    if (foundIndex !== undefined && foundRecords) {
      if (currentCellRef.current) {
        const { recordIndex, record, cellIndex, lastFoundIndex } = currentCellRef.current
        const direction = foundIndex - lastFoundIndex
        if (direction === 1 || direction === -1) {
          const newCellIndex = cellIndex + direction
          if (newCellIndex >= record.cells.length || newCellIndex < 0) {
            let newRecordIndex = recordIndex + direction
            while (foundRecords[newRecordIndex]?.cells === null) {
              newRecordIndex += direction
            }
            const newRecord = foundRecords[newRecordIndex]
            if (newRecord) {
              const newRecordCellIndex = direction === 1 ? 0 : newRecord.cells.length - 1
              setCurrentCell(newRecord.cells?.[newRecordCellIndex])
              currentCellRef.current = {recordIndex: newRecordIndex, record: newRecord, cellIndex: newRecordCellIndex, lastFoundIndex: foundIndex}
            }
          } else {
            setCurrentCell(record.cells[newCellIndex])
            currentCellRef.current = {...currentCellRef.current, cellIndex: newCellIndex, lastFoundIndex: foundIndex}
          }
        } else if (lastFoundIndex === 0 || (foundIndex === 0 && lastFoundIndex !== 1)) {
          for (let i = 0; i < foundRecords.length; i++) {
            const currentI = lastFoundIndex === 0 ? foundRecords.length - 1 - i : i
            const currentRecord = foundRecords[currentI]
            if (currentRecord?.cells) {
              const newCellIndex = lastFoundIndex === 0 ? currentRecord.cells.length - 1 : 0
              setCurrentCell(currentRecord.cells[newCellIndex])
              currentCellRef.current = {recordIndex: currentI, record: currentRecord, cellIndex: newCellIndex, lastFoundIndex: foundIndex}
              break
            }
          }
        }
      } else {
        let cellIndex = 0
        for (let i = 0; i < foundRecords.length; i++) {
          const record = foundRecords[i]
          if (!record) continue
          const numCells = record.cells?.length ?? 0
          const nextRecordStartIndex = cellIndex + numCells
          if (nextRecordStartIndex > foundIndex) {
            const offset = foundIndex - cellIndex
            setCurrentCell(record.cells?.[offset])
            currentCellRef.current = {recordIndex: i, record, cellIndex: offset, lastFoundIndex: foundIndex}
            break
          } else {
            cellIndex = nextRecordStartIndex
          }
        }
      }
      if (currentCellRef.current) {
        const recordsContainer = document.getElementById("view-records")
        if (recordsContainer) recordsContainer.scrollTop = currentCellRef.current.recordIndex * 32
      }
    } else {
      setCurrentCell(undefined)
      currentCellRef.current = undefined
    }
  }, [foundIndex, foundRecords])

  const bottomMsg = isFetching ? "Fetching rows..." : `Total: ${totalNumRows}. Loaded: ${startIndex+1} - ${endIndex+1}. Num fetches: ${numFetches}`

  return (
    <div className="w-full h-full text-[13px] bg-[#f6f8fc]">
      <div className="flex flex-col h-full w-full pb-19 relative">
        <div ref={headingsRef}>
          <ColumnHeadings
            tableId={tableData?.id}
            fields={includedFields}
            selectAll={table.getIsAllRowsSelected()}
            onCheck={table.getToggleAllRowsSelectedHandler()}
            activeFilterFieldIds={activeFilterFieldIds}
            sortedFieldIds={sortedFieldIds}
          />
        </div>
        <div ref={ref} id="view-records" className="max-h-full overflow-y-auto relative">
          <div className="flex flex-row w-full relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            <div ref={recordRef} className="flex flex-col absolute top-0 h-fit"
              style={{ width: includedFields ? `${includedFields.length * 180 + 87}px` : undefined }}>
              {virtualRows.map((virtualRow) => {
                const absoluteIndex = virtualRow.index;
                const foundCells = foundRecords?.[absoluteIndex]?.cells
                const record =
                  (isFetching && recordsCache)
                    ? recordsCache.data?.[absoluteIndex - recordsCache.startIndex]
                    : records?.[absoluteIndex - startIndex];

                const row = table
                  .getRowModel()
                  .rows.find((r) => r.original.id === record?.id)!
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
                    {record && fields && row ? (
                      <Record
                        row={row}
                        fields={includedFields}
                        activeFilterFieldIds={activeFilterFieldIds}
                        sortedFieldIds={sortedFieldIds}
                        foundCells={foundCells}
                        currentCell={currentCell}
                        rowNum={absoluteIndex + 1}
                        mainSelectedCell={mainSelectedCell}
                        setMainSelectedCell={setMainSelectedCell}
                        multipleRecordsSelected={table.getSelectedRowModel().rows.length > 1}
                        onDeleteRecord={() => {
                          if (deleteStatus === "pending") return;
                          onDeleteSelectedRecords(record.id);
                        }}
                      />
                    ) : (
                      <div
                        className="flex flex-row items center h-8 bg-gray-100 border-box border-b-[1px] cursor-default"
                        style={{ 
                          borderColor: "#dfe2e4",
                        }}
                      >
                        <div className="flex flex-row items-center text-gray-600 w-[87px] pl-4"
                          style={{
                            backgroundColor: foundCells?.length ? "#fff3d3" : undefined
                          }}
                        >
                          <span className="w-8 h-8 flex justify-center items-center">
                            {absoluteIndex + 1}
                          </span>
                        </div>
                        {includedFields?.map((field, index) => (
                          <div
                            key={index}
                            className="w-[180px] h-8 border-r-[1px] border-[#dfe2e4] border-box"
                            style={{
                              backgroundColor: foundCells?.find(cell => cell.fieldId === field.id) ? "#ffd66b" : undefined
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {tableData && view && includedFields && includedFields.length > 0 && (
          <div className="flex flex-col sticky bottom-0 border-[#dfe2e4]"
            style={{ width: includedFields ? `${includedFields.length * 180 + 87}px` : undefined,
                     borderTopWidth: (records && records.length >= 40) ? "1px" : undefined }}>
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
                {isFetching && (
                  <div className="flex flex-row items-center h-full flex-shrink-0">
                    <LoadingIcon className="w-4 h-4 animate-spin" />
                  </div>
                )}
                <span className="flex-1 truncate pr-[6px]">{bottomMsg}</span>
              </div>
            </button>
            <div className="flex flex-row items-center w-full bg-white h-8 text-gray-500 border-box border-b-[1px]" style={{ borderColor: "#dfe2e4" }}>
              <div className="w-[87px] h-full flex flex-row items-center pl-4">
                <AddIcon className="w-5 h-5 ml-[6px]" />
              </div>
              {xs.map((x, index) => (
                <button key={index} className="flex flex-row items-center border-box border-r-[1px] h-full border-[#d1d1d1] hover:bg-[#f2f4f8] cursor-pointer disabled:cursor-not-allowed"
                  disabled={addXRecordsStatus === "pending"}
                  onClick={() => onAddXRecords(x)}
                  style={{ flex: index === 0 ? undefined : 1, width: index === 0 ? "180px" : undefined }}>
                  <span className="truncate mx-[6px]">{includedFields && includedFields.length > 2 ? `Add ${xsStr[index]} rows` : `${xsStr[index]}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default View
