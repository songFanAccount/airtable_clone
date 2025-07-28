import * as Popover from "@radix-ui/react-popover";
import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { StarIcon } from "@heroicons/react/24/outline"
import { HiOutlineTrash as DeleteIcon } from "react-icons/hi";
import { toastNoFunction } from "~/hooks/helpers";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BaseInfoCorner = ({ baseId, baseName }: { baseId?: string, baseName?: string }) => {
  const router = useRouter()
  const utils = api.useUtils();
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { mutate: deleteBase, isPending } = api.base.delete.useMutation({
    onSuccess: async () => {
      await utils.base.getAll.invalidate();
    },
  });
  const [newName, setNewName] = useState<string>(baseName ?? "")
  const { mutate: renameBase, isPending: isRenaming } = api.base.rename.useMutation({
    onSuccess: async () => {
      await utils.base.getAll.invalidate()
      await utils.base.getAllFromBase.invalidate()
    }
  })
  useEffect(() => {
    if (isDeleting && !isPending) router.push("/")
  }, [isPending, isDeleting])
  useEffect(() => {
    if (isDeleting) {
      document.body.classList.add("pointer-events-none");
      return () => document.body.classList.remove("pointer-events-none");
    }
  }, [isDeleting]);
  useEffect(() => {
    setNewName(baseName ?? "")
  }, [baseName])
  return (
    <Popover.Root>
      <div className="flex flex-row gap-2 items-center pl-4">
        <div className="w-[32px] h-[32px] flex justify-center items-center bg-[#99455a] rounded-[6px]">
          <img
            src="/assets/airtable_base.svg"
            alt="Airtable Base"
            className="w-[20px] h-[20px] filter invert"
          />
        </div>
        <div className="max-w-[480px]">
          <Popover.Trigger asChild>
            <button className="flex flex-row items-center cursor-pointer max-w-full">
              <span className="text-[17px] font-[675] truncate">{baseName}</span>
              <DropdownIcon className="w-4 h-4 ml-1 text-gray-700 flex-shrink-0" />
            </button>
          </Popover.Trigger>
        </div>
      </div>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          className="bg-white rounded-[6px] p-4 z-50 w-[400px] relative top-6 right-12"
          style={{
            boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)"
          }}
        >
          <div className="flex flex-row items-center h-[50px]">
            <input
              type="text"
              value={newName}
              tabIndex={-1}
              autoFocus={false}
              onChange={(e) => {
                const newValue = e.target.value
                setNewName(newValue)
              }}
              onBlur={() => {
                if (newName.trim() !== baseName?.trim()) {
                  if (baseId) renameBase({id: baseId, newName: newName.trim()})
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-full p-2 text-[20px] placeholder:text-gray-800 rounded-[3px] hover:bg-[#f2f4f8] focus:bg-[#f2f4f8] outline-[#a0c6ff]"
            />
            <div className="flex flex-row items-center gap-2 ml-2">
              <button className="w-6 h-4 flex justify-center items-center cursor-pointer text-gray-800"
                onClick={toastNoFunction}
              >
                <StarIcon className="w-[18px] h-[18px]"/>
              </button>
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="w-6 h-4 flex justify-center items-center cursor-pointer text-gray-800">
                    <DeleteIcon className="w-[18px] h-[18px]" />
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    side="bottom"
                    align="start"
                    className="bg-white shadow-md p-3 rounded z-50 relative top-3"
                  >
                    <button
                      className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
                      onClick={() => {
                        if (baseId) {
                          deleteBase({ id: baseId });
                          setIsDeleting(true);
                        }
                      }}
                    >
                      Confirm delete base
                    </button>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default BaseInfoCorner;
