'use client'
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "~/trpc/react"
import Header from "./Header/Header"
import Sidebar from "./SideBar/Sidebar"
import Content from "./Content/Content"
import type { $Enums, FieldType } from "@prisma/client"

export type BaseData = {
  user: {
    name: string | null;
    id: string;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
  tables: Array<{
    views: ViewsData;
    fields: FieldsData;
    lastOpenedView: ViewData | null;
    id: string;
    name: string;
    baseId: string;
    createdAt: Date;
    lastOpenedViewId: string | null;
    recordCount: number;
    lastAddedRecordPos: number;
  }>;
  lastOpenedTable: {
    id: string;
    name: string;
    baseId: string;
    createdAt: Date;
    lastOpenedViewId: string | null;
  } | null;
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
} | null | undefined;

export type TableData = ({
  views: ViewsData;
  fields: FieldsData;
  lastOpenedView: ViewData | null;
} & {
  baseId: string;
  name: string;
  id: string;
  createdAt: Date;
  lastOpenedViewId: string | null;
  recordCount: number;
  lastAddedRecordPos: number;
}) | undefined
export type TablesData = TableData[] | undefined
export type ViewData = {
  tableId: string;
  name: string;
  id: string;
} | undefined
export type ViewsData = ViewData[] | undefined
export type FilterData = {
  id: string;
  viewId: string;
  fieldId: string;
  operator: $Enums.FilterOperator;
  joinType: $Enums.FilterJoinType;
  compareVal: string;
}
export type SortData = {
  id: string,
  viewId: string,
  fieldId: string,
  operator: $Enums.SortOperator,
  createdAt: Date
}
export type ViewDetailedData = {
  id: string,
  tableId: string,
  name: string,
  hiddenFieldIds: string[],
  filters: FilterData[],
  sorts: SortData[]
} | undefined | null
export type FieldData = {
  tableId: string;
  type: FieldType;
  name: string;
  id: string;
  columnNumber: number;
}
export type FieldsData = FieldData[] | undefined
export type RecordData = {
  id: string;
  tableId: string;
  rowNum: number;
  cells: CellData[]
}
export type RecordsData = RecordData[] | undefined
export type CellData = {
  id: string;
  value: string;
  fieldId: string;
  recordId: string;
}

const BasePage = () => {
  const { baseId, tableId, viewId } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { data: baseData, refetch } = api.base.getAllFromBase.useQuery({ id: baseId as string }, {
    enabled: false
  })
  useEffect(() => {
    const interval = setInterval(() => {
      void refetch().then((res) => {
        if (res.data) {
          clearInterval(interval)
        }
      })
    }, 500)
  
    return () => clearInterval(interval)
  }, [refetch])
  const tableData = baseData?.tables.find((table) => table.id === tableId)
  const tableViews = tableData?.views
  const viewData = tableData?.views.find((view) => view.id === viewId)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated" && baseData && session.user.id !== baseData.userId) {
      router.push("/")
    }
  }, [status, baseData, session, router])
  useEffect(() => {
    if (baseData && tableData) {
      document.title = `${baseData.name}: ${tableData.name} - Airtable`
    }
  }, [baseData, tableData])
  return (
    <div className="flex flex-row h-screen w-screen overflow-x-clip">
      <Sidebar/>
      <div className="flex flex-col h-full w-full overflow-x-hidden">
        <Header baseId={baseData?.id} baseName={baseData?.name}/>
        <Content baseData={baseData} currentTable={tableData} views={tableViews} currentView={viewData} />
      </div>
    </div>
  )
}
export default BasePage