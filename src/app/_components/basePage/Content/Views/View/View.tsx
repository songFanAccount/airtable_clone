import { type RecordsData, type FieldsData, type TableData, type ViewDetailedData, type CellData, type RecordData, type FilterData } from "../../../BasePage"
import { GoPlus as AddIcon } from "react-icons/go";
import { Loader2 as LoadingIcon } from "lucide-react";
import ColumnHeadings from "./ColumnHeadings"
import Record from "./Record"
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useVirtualizer } from '@tanstack/react-virtual'
import { keepPreviousData } from "@tanstack/react-query";
import { FieldType, FilterJoinType, FilterOperator } from "@prisma/client";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef
} from '@tanstack/react-table'
import { nanoid } from "nanoid";

function useDebounced<T>(value: T, delay = 120) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function generateCellCondStr(filter: FilterData, fieldType: FieldType): string {
  const { fieldId: id } = filter;
  const { operator, compareVal } = filter;

  switch (fieldType) {
    case FieldType.Text:
      switch (operator) {
        case FilterOperator.CONTAINS:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value LIKE CONCAT('%', '${compareVal}', '%')
            )
          `;
        case FilterOperator.NOTCONTAINS:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value NOT LIKE CONCAT('%', '${compareVal}', '%')
            )
          `;
        case FilterOperator.EQUALTO:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value = '${compareVal}'
            )
          `;
        case FilterOperator.NOTEMPTY:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc.value IS NOT NULL
                AND fc.value <> ''
            )
          `;
        case FilterOperator.EMPTY:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND (fc.value IS NULL OR fc.value = '')
            )
          `;
        default:
          return '';
      }
    case FieldType.Number:
      switch (operator) {
        case FilterOperator.GREATERTHAN:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc."numValue" > ${Number(compareVal)}
            )
          `;
        default:
          return `
            EXISTS (
              SELECT 1
              FROM "Cell" fc
              INNER JOIN "Field" ff ON fc."fieldId" = ff.id
              WHERE fc."recordId" = r.id
                AND ff.id = '${id}'
                AND fc."numValue" < ${Number(compareVal)}
            )
          `;
      }
    default:
      return '';
  }
}

const View = ({ tableData, view, searchStr, foundIndex, foundRecords, searchNum }: { tableData: TableData, view: ViewDetailedData, searchStr: string, foundIndex?: number, foundRecords: RecordsData, searchNum: number }) => {
  const utils = api.useUtils()
  const fields: FieldsData = tableData?.fields
  const includedFields: FieldsData = fields?.filter(field => !view?.hiddenFieldIds.includes(field.id))
  const [totalNumRows, setTotalNumRows] = useState<number>(0)

  // Virtualization
  const rowVirtualizer = useVirtualizer({
    count: totalNumRows,
    getScrollElement: () => ref.current,
    estimateSize: () => 32,
    overscan: 40
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const startIndex = virtualRows[0]?.index ?? 0
  const endIndex = virtualRows[virtualRows.length - 1]?.index ?? 0
  const dStart = useDebounced(startIndex)
  const dTake  = 150
  const [numFetches, setNumFetches] = useState<number>(0)
  const [filtersStr, setFiltersStr] = useState<string | undefined>(undefined)
  const { data: recordsObj, isFetching, refetch } = api.base.getRecords.useQuery(
    { viewId: view?.id ?? "", skip: dStart, take: dTake, filtersStr: filtersStr ?? "" },
    { enabled: !!tableData?.id && !!view?.id && filtersStr !== undefined, placeholderData: keepPreviousData },
  )
  const { data: recordCount, refetch: fetchNumRecords } = api.base.getNumRecords.useQuery(
    { filtersStr: filtersStr ?? ""},
    { enabled: !!tableData?.id && !!view?.id && filtersStr !== undefined}
  )
  
  function validFilter(filter: FilterData) {
    if (filter.operator === FilterOperator.EMPTY || filter.operator === FilterOperator.NOTEMPTY) return true
    return filter.compareVal !== ""
  }
  useEffect(() => {
    if (view && tableData) {
      const filters: FilterData[] = view.filters.filter(filter => validFilter(filter))
      const andStrs: string[] = []
      const orStrs: string[] = []
      for (const filter of filters) {
        const fieldType = fields?.find(field => field.id === filter.fieldId)?.type
        if (fieldType) {
          if (filter.joinType === FilterJoinType.AND) andStrs.push(generateCellCondStr(filter, fieldType))
          else orStrs.push(generateCellCondStr(filter, fieldType))
        }
      }
      const andClause = andStrs.length
        ? andStrs.map((str, i) => `${i > 0 ? "AND " : ""}${str}`).join(" ")
        : "TRUE";
  
      const orClause = orStrs.length
        ? orStrs.map((str, i) => `${i > 0 ? "OR " : ""}${str}`).join(" ")
        : "";
  
      let newFiltersStr = "";
  
      if (andStrs.length && orStrs.length) {
        newFiltersStr = `
          (r."tableId" = '${tableData.id}' AND (${andClause}))
          OR
          (r."tableId" = '${tableData.id}' AND (${orClause}))
        `;
      } else {
        newFiltersStr = andStrs.length 
          ? `r."tableId" = '${tableData.id}' AND (${andClause})`
          :
            orStrs.length
            ? `r."tableId" = '${tableData.id}' AND (${orClause})`
            : `r."tableId" = '${tableData.id}'`
      }
      if (filtersStr && filtersStr !== newFiltersStr) {
        void fetchNumRecords();
      }
      void refetch();
      setFiltersStr(newFiltersStr)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tableData]);
  useEffect(() => {
    if (filtersStr) {
      void fetchNumRecords()
      void refetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersStr])
  const records = recordsObj?.records
  useEffect(() => {
    if (recordCount) {
      setTotalNumRows(recordCount.totalRecordsInView)
    }
  }, [recordCount])

  // Cache last fetched data for better scrolling
  interface Cache { data: RecordsData, startIndex: number, endIndex: number }
  const [recordsCache, setRecordsCache] = useState<Cache | undefined>(undefined)
  useEffect(() => {
    if (!isFetching) {
      setRecordsCache({ data: records, startIndex: dStart, endIndex: dStart + dTake })
      setNumFetches(numFetches + 1)
      setMainSelectedCell(undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching])

  // Table setup
  const columns: ColumnDef<RecordData>[] = includedFields?.map(field => ({
    id: field.id,
    header: field.name,
    accessorFn: row => row.cells.find(cell => cell.fieldId === field.id)?.value ?? "",
    meta: field
  })) ?? []

  const table = useReactTable({
    data: records ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([])
  function selectRecord(recordId: string) {
    const newRecordIds = new Set(selectedRecordIds)
    if (newRecordIds.has(recordId)) {
      newRecordIds.delete(recordId)
    } else {
      newRecordIds.add(recordId)
    }
    setSelectedRecordIds([...newRecordIds])
  }
  const { mutate: addRecord, status: addRecordStatus } = api.base.addNewRecord.useMutation({
    onSuccess: async (_) => {
      void setTotalNumRows(prev => prev+1)
      void fetchNumRecords()
    }
  })
  function onAddRecord() {
    if (addRecordStatus === "pending") return
    const newRecordId = nanoid(10)
    if (tableData && fields) {
      addRecord({ tableId: tableData.id, newRecordId })
    }
  }
  const [startTime, setStartTime] = useState<number | undefined>(undefined)
  const { mutate: addXRecords, status: addXRecordsStatus } = api.base.addXRecords.useMutation({
    onMutate: ({ numRecords }) => {
      const toastId = toast.loading(`Adding ${numRecords} records…`);
      setStartTime(Date.now());
      return { toastId };
    },
    onSuccess: async (addEvent, _vars, ctx) => {
      const timeTakenStr = ((Date.now() - (startTime ?? 0)) / 1000).toFixed(2)
      if (startTime) {
        setStartTime(undefined);
      }
      setTotalNumRows(prev => prev+addEvent.count)
      toast.update(ctx?.toastId, {
        render: `${addEvent.count} records, time: ${timeTakenStr}s`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      await utils.base.getRecords.invalidate();
    },
    onError: (err, _vars, ctx) => {
      toast.update(ctx?.toastId ?? "", {
        render: err?.message ?? "Failed to add records.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setStartTime(undefined);
    },
  });
  const xs = [10, 100, 1000, 100000]
  const xsStr = ["10", "100", "1000", "100k"]
  function onAddXRecords(x: number) {
    if (addXRecordsStatus === "pending") return
    if (tableData) {
      addXRecords({ tableId: tableData.id, numRecords: x })
    }
  }

  const { mutate: deleteRecords, status: deleteStatus } = api.base.deleteRecords.useMutation({
    onSuccess: async (deleteInfo) => {
      toast.success(`Deleted ${deleteInfo.count} record${deleteInfo.count > 1 ? "s" : ""}!`)
      await utils.base.getRecords.invalidate()
    }
  })
  function onDeleteSelectedRecords(callId: string) {
    if (!tableData) return
    deleteRecords({ tableId: tableData.id, recordIds: selectedRecordIds.includes(callId) ? selectedRecordIds : [...selectedRecordIds, callId] })
  }

  // Refs and filters
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const popover = document.querySelector('[data-popover="true"]');
      if (ref.current && !ref.current.contains(event.target as Node) && !popover?.contains(event.target as Node)) {
        setMainSelectedCell(undefined)
        setSelectedRecordIds([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
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
  const currentCellRef = useRef<{currentSearchNum?: number, recordIndex: number, record: RecordData, cellIndex: number, lastFoundIndex: number} | undefined>(undefined)
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
    if (currentCellRef.current && currentCellRef.current.currentSearchNum !== searchNum) {
      currentCellRef.current = undefined
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
              currentCellRef.current = {...currentCellRef.current, recordIndex: newRecordIndex, record: newRecord, cellIndex: newRecordCellIndex, lastFoundIndex: foundIndex}
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
              currentCellRef.current = {...currentCellRef.current, recordIndex: currentI, record: currentRecord, cellIndex: newCellIndex, lastFoundIndex: foundIndex}
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
            currentCellRef.current = {currentSearchNum: searchNum, recordIndex: i, record, cellIndex: offset, lastFoundIndex: foundIndex}
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
  }, [foundIndex, foundRecords, searchNum])

  const bottomMsg = `Total: ${totalNumRows}. Loaded: ${startIndex+1} - ${endIndex+1}. Num fetches: ${numFetches}.`

  return (
    <div className="relative w-full h-full text-[13px] bg-[#f6f8fc]">
      {addXRecordsStatus === "pending" && (
        <div className="absolute inset-0 bg-gray-400 opacity-20 z-50 flex items-center justify-center pointer-events-auto cursor-not-allowed">
        </div>
      )}
      <div className="flex flex-col h-full w-full pb-19 relative">
        <div ref={headingsRef}>
          <ColumnHeadings
            tableId={tableData?.id}
            fields={includedFields}
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
                    : records?.[absoluteIndex - dStart];
                const startI = isFetching && recordsCache ? recordsCache.startIndex : dStart
                const row = record && table
                  .getRowModel()
                  .rows[absoluteIndex - startI]!
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
                        onSelect={() => selectRecord(record.id)}
                        isSelected={selectedRecordIds.includes(record.id)}
                        multipleRecordsSelected={selectedRecordIds.length > 1}
                        onDeleteRecord={() => {
                          if (deleteStatus === "pending") return;
                          onDeleteSelectedRecords(record.id);
                        }}
                        refetch={() => refetch()}
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
              disabled={addRecordStatus === "pending" || addXRecordsStatus === "pending"}
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
