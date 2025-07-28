'use client'
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { api } from "~/trpc/react"
import Header from "./Header/Header"
import Sidebar from "./SideBar/Sidebar"
import Content from "./Content/Content"

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
        <Content />
      </div>
    </div>
  )
}
export default BasePage