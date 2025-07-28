import { useState } from "react"
import { StarIcon } from "@heroicons/react/24/outline"
import { HiOutlineTrash as DeleteIcon } from "react-icons/hi";
import type { BaseInfo } from "./Bases";
import { toastNoFunction } from "~/hooks/helpers";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ColumnsLayoutProps {
  el1: React.ReactElement,
  el2: React.ReactElement,
  el3: React.ReactElement,
  height: number,
  hasSeparator?: boolean,
  moreStyle?: string
}
const ColumnsLayout = ({ el1, el2, el3, height, moreStyle, hasSeparator=false } : ColumnsLayoutProps) => {
  return (
    <div className="flex flex-col w-full">
      <div className={`flex flex-row items-center h-[${height}px] gap-x-6 ${moreStyle}`}>
        <div className="w-full min-w-[170px] max-w-[500px]">
          {el1}
        </div>
        <div className="flex flex-row gap-x-6 items-center pr-[57px] min-w-[333=px] flex-1">
          <div className="flex flex-row justify-start items-center flex-1 min-w-[130px]">
            {el2}
          </div>
          <div className="flex flex-row justify-start items-center flex-1 min-w-[130px]">
            {el3}
          </div>
        </div>
      </div>
      {
        hasSeparator &&
        <hr className="w-full my-[6.5px]"
          style={{
            borderColor: "#e0e1e1"
          }}
        />
      }
    </div>
  )
}

const TitlesRow = () => {
  return (
    <div className="w-full mb-4">
      <ColumnsLayout
        el1={<span className="text-[13px] text-gray-600">Name</span>}
        el2={<span className="text-[13px] text-gray-600">Last opened</span>}
        el3={<span className="text-[13px] text-gray-600">Workspace</span>}
        height={19.5}
        hasSeparator={true}
      />
    </div>
  )
}

interface BaseRowProps extends BaseInfo {
  deleteBase: (id: string) => void,
  isDisabled: boolean
}
const BaseRow = ({ name, id, lastOpenedTableId, lastOpenedViewId, deleteBase, isDisabled } : BaseRowProps) => {
  const shortenedName = `${name[0]?.toUpperCase()}${name.length > 1 ? name[1] : ''}`
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const isActive = isHovered && !isDisabled
  const router = useRouter()
  function openBase(id: string) {
    if (lastOpenedTableId && lastOpenedViewId) router.push(`/base/${id}/${lastOpenedTableId}/${lastOpenedViewId}`)
  }
  return (
    <div className="rounded-[6px]"
      style={{
        cursor: isActive ? "pointer" : "not-allowed",
        backgroundColor: isHovered ? "#ecedee" : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {if(!isDisabled) openBase(id)}}
    >
      <ColumnsLayout
        height={44}
        moreStyle="py-2"
        el1={
          <div className="w-full flex flex-row items-center truncate">
            <div className="pl-2">
              <div className="flex justify-center items-center w-6 h-6 rounded-[6px] bg-[#99455a] text-white border-box">
                <span className="text-[11px]">{shortenedName}</span>
              </div>
            </div>
            <div className="w-full flex flex-row items-center justify-between px-3">
              <div className="text-[13px] flex flex-row items-center">
                <span className="font-semibold min-w-0 truncate flex-shrink-1">{name}</span>
                {isActive && <span className="text-gray-600 ml-3 whitespace-nowrap min-w-[62px]">Open data</span>}
              </div>
              {
                isActive &&
                <div className="flex flex-row items-center text-gray-600">
                  <button className="flex justify-center align-center p-1" 
                    style={{
                      cursor: isActive ? "pointer" : "not-allowed",
                    }}
                    onClick={(event) => {event.stopPropagation(); toastNoFunction()}}
                  >
                    <StarIcon className=" ml-2 w-4 h-4"/>
                  </button>
                  <button className="flex justify-center align-center p-1"
                    style={{
                      cursor: isActive ? "pointer" : "not-allowed",
                    }}
                    onClick={async (event) => {event.stopPropagation(); deleteBase(id)}}
                  >
                    <DeleteIcon className="w-4 h-4"/>
                  </button>
                </div>
              }
            </div>
          </div>
        }
        el2={<span className="text-[13px] text-gray-600">Opened X time ago</span>}
        el3={<span className="text-[13px] text-gray-600">My First Workspace</span>}
      />
    </div>
  )
}

const BasesList = ({ bases } : { bases: BaseInfo[] }) => {
  const { data: session } = useSession()
  const utils = api.useUtils();
  const { mutate: deleteBase, isPending } = api.base.delete.useMutation({
    onSuccess: async () => {
      await utils.base.getAll.invalidate();
    },
  });
  const { isFetching } = api.base.getAll.useQuery(undefined, {
    enabled: !!session?.user,
  });
  return (
    <div className="flex flex-col px-1 min-h-[500px]">
      <TitlesRow/>
      <div className="flex flex-col">
        {
          bases.map((baseInfo, index) => <BaseRow key={index} isDisabled={isPending || isFetching} deleteBase={(id: string) => deleteBase({id})} {...baseInfo}/>)
        }
      </div>
    </div>
  )
}
export default BasesList