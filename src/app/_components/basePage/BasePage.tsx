'use client'
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { api } from "~/trpc/react"
import Header from "./Header/Header"
import Sidebar from "./SideBar/Sidebar"
import Content from "./Content/Content"

export type BaseData = {
  user: {
    name: string | null;
    id: string;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
  tables: Array<{
    views: Array<{
      name: string;
      id: string;
      tableId: string;
    }>;
    lastOpenedView: {
      name: string;
      id: string;
      tableId: string;
    } | null;
    id: string;
    name: string;
    baseId: string;
    createdAt: Date;
    lastOpenedViewId: string | null;
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
  views: {
      tableId: string;
      name: string;
      id: string;
  }[];
  lastOpenedView: {
      tableId: string;
      name: string;
      id: string;
  } | null;
} & {
  baseId: string;
  name: string;
  id: string;
  createdAt: Date;
  lastOpenedViewId: string | null;
}) | undefined

export type TablesData = Array<{
  views: Array<{
    name: string;
    id: string;
    tableId: string;
  }>;
  lastOpenedView: {
    name: string;
    id: string;
    tableId: string;
  } | null;
  id: string;
  name: string;
  baseId: string;
  createdAt: Date;
  lastOpenedViewId: string | null;
}> | undefined

export type ViewData = {
  tableId: string;
  name: string;
  id: string;
} | undefined
const BasePage = () => {

  const { baseId, tableId, viewId } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { data: baseData, isLoading } = api.base.getAllFromBase.useQuery({ id: baseId as string }, {
    enabled: !!session?.user
  })
  const tableData = baseData?.tables.find((table) => table.id === tableId)
  const viewData = tableData?.views.find((view) => view.id === viewId)
  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status])
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
        <Content baseData={baseData} currentTable={tableData} currentView={viewData} />
      </div>
    </div>
  )
}
export default BasePage