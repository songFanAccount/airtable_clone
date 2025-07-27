import { useState } from "react"
import type { BaseInfo } from "./Bases"
import { HomeBoxWrapper } from "./Suggestions"
import { GoDatabase as BaseIcon } from "react-icons/go"
import { StarIcon } from "@heroicons/react/24/outline"
import { HiOutlineTrash as DeleteIcon } from "react-icons/hi";
import { toastNoFunction, toastTODO } from "~/hooks/helpers"
import { useSession } from "next-auth/react"
import { api } from "~/trpc/react"

interface BaseBoxProps extends BaseInfo {
  deleteBase: (id: string) => void,
  isDisabled: boolean
}
const BaseBox = ({ name, id, deleteBase, isDisabled } : BaseBoxProps) => {
  const shortenedName = `${name[0]?.toUpperCase()}${name.length > 1 ? name[1] : ''}`
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const isActive = isHovered && !isDisabled
  return (
    <HomeBoxWrapper isDisabled={isDisabled}>
      <div className="flex flex-row h-[92px] items-center relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {if(!isDisabled) toastTODO("Open base")}}
      >
        <div className="w-[92px] h-[92px] flex justify-center items-center">
          <div className="flex justify-center items-center w-[56px] h-[56px] rounded-[12px] bg-[#99455a] text-white border-box">
            <span className="text-[22px]">{shortenedName}</span>
          </div>
        </div>
        <div className="flex flex-col mr-4">
          <span className="text-[13px] font-[500] h-[19.5px]">{name}</span>
          <div className="flex flex-col justify-center h-[16.5px] mt-1">
            {
              isHovered
              ?
                <div className="flex flex-row items center text-gray-600">
                  <div className="w-4 h-4 flex justify-center items-center mr-2">
                    <BaseIcon className="w-[14px] h-[14px]"/>
                  </div>
                  <span className="text-[11px]">Open data</span>
                </div>
              :
                <span className="text-[11px] text-gray-600">Opened X time ago</span>
            }
          </div>
        </div>
        {
          isActive &&
          <div className="absolute top-0 right-0 mt-4 mr-4 ml-1">
            <div className="flex flex-row items-center gap-x-[6px] text-gray-800">
              <button className="w-[28px] h-[28px] flex justify-center items-center border rounded-[6px]"
                style={{
                  borderColor: "#d5d5d5",
                  cursor: isActive ? "pointer" : "not-allowed",
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  toastNoFunction()
                }}
              >              
                <StarIcon className="w-[16px] h-[16px]"/>
              </button>
              <button className="w-[28px] h-[28px] flex justify-center items-center border rounded-[6px]"
                style={{
                  borderColor: "#d5d5d5",
                  cursor: isActive ? "pointer" : "not-allowed",
                }}
                onClick={async (event) => {event.stopPropagation(); deleteBase(id)}}
              >
                <DeleteIcon className="w-4 h-4"/>
              </button>
            </div>
          </div>
        }
      </div>
    </HomeBoxWrapper>
  )
}
const BasesGrid = ({ bases } : { bases: BaseInfo[] }) => {
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
    <div className="w-full px-1 min-h-[500px]">
      <div className="w-full overflow-x-hidden py-1 mb-6 flex-shrink-0">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(286px, 1fr))",
            minWidth: "384px"
          }}
        >
          {bases.map((baseInfo, index) => (
            <BaseBox key={index} isDisabled={isPending || isFetching} deleteBase={(id: string) => deleteBase({id})} {...baseInfo} />
          ))}
        </div>
      </div>
    </div>
  )
}
export default BasesGrid