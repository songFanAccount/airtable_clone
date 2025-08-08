import { FieldType } from "@prisma/client"
import type { FieldsData } from "../../../BasePage"
import { ImTextColor as TextTypeIcon } from "react-icons/im";
import { FaHashtag as NumberTypeIcon } from "react-icons/fa";
import * as Switch from '@radix-ui/react-switch';
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import { Loader2 as LoadingIcon } from "lucide-react";

interface Props {
  viewId: string,
  fields: FieldsData,
  hiddenFieldIds?: Set<string>,
}

const HideFieldsConfig = ({ viewId, fields, hiddenFieldIds } : Props) => {
  const utils = api.useUtils()
  const [newHiddenIds, setNewHiddenIds] = useState<Set<string>>(hiddenFieldIds ?? new Set())
  useEffect(() => {
    if (hiddenFieldIds) {
      if (hiddenFieldIds.size === newHiddenIds.size && !([...hiddenFieldIds].every(fieldId => newHiddenIds.has(fieldId))))
      setNewHiddenIds(hiddenFieldIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenFieldIds])
  const [updateTimer, setUpdateTimer] = useState<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (hiddenFieldIds?.size !== newHiddenIds.size || !([...hiddenFieldIds].every(fieldId => newHiddenIds.has(fieldId)))) {
      if (updateTimer) clearTimeout(updateTimer)
          const newTimer = setTimeout(() => {
        updateHiddenFields({viewId, fieldIds: [...newHiddenIds]})
      }, 1500)
      setUpdateTimer(newTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newHiddenIds])
  const { mutate: updateHiddenFields, status: updateHFStatus } = api.base.updateViewHiddenFields.useMutation({
    onSuccess: async (_) => {
      await utils.base.getView.invalidate()
      await utils.base.searchInView.invalidate()
    }
  })
  function updateNewHiddenIds(ids: Set<string>) {
    if (updateHFStatus !== "pending") setNewHiddenIds(ids)
  }
  return (
    <div className="flex flex-col gap-2 w-full text-gray-600 text-[13px]">
      {
        fields?.map((field, index) => {
          const Icon = field.type === FieldType.Text ? TextTypeIcon : NumberTypeIcon
          const dim = field.type === FieldType.Text ? "16px" : "12px"
          return (
            <div key={index} className="flex flex-row px-1 items-center h-[20px] hover:bg-[#f2f2f2] rounded-[3px]"
              onClick={() => {
                const checked = !newHiddenIds.has(field.id)
                const newHiddenFieldIds = new Set(newHiddenIds)
                if (checked) newHiddenFieldIds.add(field.id)
                else newHiddenFieldIds.delete(field.id)
                updateNewHiddenIds(newHiddenFieldIds)
              }}
              style={{
                opacity: updateHFStatus === "pending" ? 0.6 : 1,
                cursor: updateHFStatus === "pending" ? "not-allowed" : "pointer"
              }}
            >
              <Switch.Root
                id={`switch-${field.name}`}
                checked={!newHiddenIds.has(field.id)}
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={(value) => {
                  const newHiddenFieldIds = new Set(newHiddenIds)
                  if (!value) newHiddenFieldIds.add(field.id)
                  else newHiddenFieldIds.delete(field.id)
                  updateNewHiddenIds(newHiddenFieldIds)
                }}
                className="
                  w-[12.8px] h-[8px] bg-gray-300 rounded-full relative 
                  data-[state=checked]:bg-green-700 
                  focus:outline-none
                  transition-colors
                  cursor-pointer
                "
              >
                <Switch.Thumb
                  className="
                    block w-1 h-1 bg-white rounded-full shadow-md 
                    transition-transform 
                    translate-x-[2px]
                    cursor-pointer
                    data-[state=checked]:translate-x-2
                  "
                />
              </Switch.Root>
              <div className="w-4 h-4 mr-2 ml-4 flex justify-center items-center">
                <Icon className=""
                  style={{
                    width: dim,
                    height: dim,
                  }}
                />
              </div>
              <span>
                {field.name}
              </span>
            </div>
          )
        })
      }
      <div className="flex flex-row items-center justify-between h-[26px] w-full mt-2 text-[12px] font-[500] text-gray-700 hover:text-black">
        {
          updateHFStatus === "pending"
          ?
            <div className="flex flex-row w-full justify-center items-center">
              <div className="flex flex-row gap-2 items-center">
                <span>Applying changes</span>
                <LoadingIcon className="w-4 h-4 animate-spin"/>
              </div>
            </div>
          :
          [
            { text: "Hide all", func: () => updateNewHiddenIds(new Set(fields?.map(field => field.id))) },
            { text: "Show all", func: () => updateNewHiddenIds(new Set()) }
          ].map(({text, func}, index) => (
            <button key={index} className="w-[136px] h-full rounded-[3px] flex justify-center items-center bg-[#f5f5f5] hover:bg-[#f2f2f2] cursor-pointer"
              onClick={func}
            >
              <span>{text}</span>
            </button>
          ))
        }
      </div>
    </div>
  )
}

export default HideFieldsConfig