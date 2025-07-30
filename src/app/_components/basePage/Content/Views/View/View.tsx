import type { FieldsData, RecordsData, TableData, ViewData } from "../../../BasePage"
import { GoPlus as AddIcon } from "react-icons/go";
import ColumnHeadings from "./ColumnHeadings"
import Record from "./Record"
import { api } from "~/trpc/react";
import { useEffect, useRef, useState } from "react";

const View = ({ tableData, currentView } : { tableData: TableData, currentView: ViewData }) => {
  const fields: FieldsData = tableData?.fields
  if (fields) fields.sort((a, b) => a.columnNumber - b.columnNumber)
  const records: RecordsData = tableData?.records
  if (records) records.sort((a, b) => a.position - b.position)
  const largestPosition = (records && records.length > 0 && records[records.length - 1]) ? records[records.length - 1]?.position : undefined
  const utils = api.useUtils()
  const { mutate: addRecord } = api.base.addNewRecord.useMutation({
    onSuccess: async (createdRecord) => {
      if (createdRecord) {
        await utils.base.getAllFromBase.invalidate()
      }
    }
  })
  function onAddRecord() {
    if (tableData && fields && largestPosition) addRecord({tableId: tableData.id, newPosition: Math.floor(largestPosition) + 1, fieldIds: fields.map(field => field.id)})
  }
  const [mainSelectedCell, setMainSelectedCell] = useState<[number, number] | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setMainSelectedCell(undefined)
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div className="flex flex-col w-full h-full text-[13px] bg-[#f6f8fc]">
      <ColumnHeadings tableId={tableData?.id} fields={tableData?.fields}/>
      <div className="flex flex-col w-fit"
        ref={ref}
      >
        {
          records?.map((record, index) => <Record key={index} fields={fields} record={record} rowNum={index + 1} mainSelectedCell={mainSelectedCell} setMainSelectedCell={setMainSelectedCell}/>)
        }
        <button className="flex flex-row items-center w-full bg-white h-8 hover:bg-[#f2f4f8] cursor-pointer border-box border-b-[1px] border-r-[1px]"
          style={{
            borderColor: "#dfe2e4"
          }}
          onClick={onAddRecord}
        >
          <div className="w-[87px] h-full flex flex-row items-center pl-4">
            <AddIcon className="w-5 h-5 text-gray-500 ml-[6px]"/>
          </div>
          <div className="w-[180px] border-box border-r-[1px] h-full border-[#d1d1d1]"/>
        </button>
      </div>
    </div>
  )
}
export default View