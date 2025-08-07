import { FaReact as OmniIcon } from "react-icons/fa";
import { PiGridFour as TemplatesIcon, PiTable as NewAppIcon } from "react-icons/pi";
import { GoArrowUp as UploadIcon } from "react-icons/go";
import { useState } from "react";
import { toastNoWay } from "~/hooks/helpers";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { nanoid } from 'nanoid'

interface SuggestionInfo {
  Icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  func: () => void;
  isDisabled?: boolean
}

export const HomeBoxWrapper = ({ children, isDisabled=false, moreStyle } : { children: React.ReactElement, isDisabled?: boolean, moreStyle?: string }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false)
  return (
    <div
      className={`bg-white border rounded-[6px] w-full cursor-pointer ${moreStyle}`}
      style={{
        cursor: (isHovered && !isDisabled) ? "pointer" : "not-allowed",
        borderColor: (isHovered && !isDisabled) ? "#c0c1c2" : "hsl(202, 10%, 88%)",
        boxShadow: (isHovered && !isDisabled)
          ? 
            "-1px -1px 1px rgba(0, 0, 0, 0.02), 1px 1px 2px rgba(0, 0, 0, 0.08), 2px 2px 4px rgba(0, 0, 0, 0.12), 4px 4px 8px rgba(0, 0, 0, 0.08)"
          : 
            "0px 1px 3px rgba(0,0,0,0.1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  )
}
const SuggestionBox = ({ info }: { info: SuggestionInfo }) => {
  const { Icon, iconColor, title, description, func, isDisabled=false } = info;
  return (
    <HomeBoxWrapper moreStyle="p-4" isDisabled={isDisabled}>
      <button className={`flex flex-col items-start w-full text-left ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={func}
        disabled={isDisabled}
      >
        <div className="flex flex-row items-center">
          <Icon className="w-[20px] h-[20px] flex-shrink-0" style={{ color: iconColor }} />
          <p className="ml-2 font-semibold text-[15px]">{title}</p>
        </div>
        <p className="text-[13px] text-[#616670] mt-1">{description}</p>
      </button>
    </HomeBoxWrapper>
  );
};

const Suggestions = () => {
  const { data: session } = useSession()
  const utils = api.useUtils()
  const router  = useRouter()
  const { mutate: createBase, status } = api.base.create.useMutation({
    onSuccess: async (createdBase) => {
      if (createdBase) {
        toast.success(`Created base: "${createdBase.name}"`)
        await utils.base.getAll.invalidate()
      }
    }
  })
  function onCreateBase() {
    const baseId = nanoid(6)
    const tableId = nanoid(6)
    const viewId = nanoid(6)
    createBase({name: "Untitled Base", baseId, tableId, viewId})
    router.push(`/base/${baseId}/${tableId}/${viewId}`)
  }
  const isLoading = status === "pending"
  const suggestions: SuggestionInfo[] = [
    {
      Icon: OmniIcon,
      iconColor: "#dd04a8",
      title: "Start with Omni",
      description: "Use AI to build a custom app tailored to your workflow.",
      func: toastNoWay
    },
    {
      Icon: TemplatesIcon,
      iconColor: "#63498d",
      title: "Start with templates",
      description: "Select a template to get started and customize as you go.",
      func: toastNoWay
    },
    {
      Icon: UploadIcon,
      iconColor: "#0d7f78",
      title: "Quickly upload",
      description: "Easily migrate your existing projects in just a few minutes.",
      func: toastNoWay
    },
    {
      Icon: NewAppIcon,
      iconColor: "#3b66a3",
      title: "Build an app on your own",
      description: "Start with a blank app and build your ideal workflow.",
      func: () => {if (!session?.user) return; onCreateBase(); },
      isDisabled: !session?.user || isLoading
    },
  ];

  return (
    <div className="w-full overflow-x-hidden py-1 mb-6 flex-shrink-0">
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          minWidth: "384px"
        }}
      >
        {suggestions.map((suggestion, index) => (
          <SuggestionBox key={index} info={suggestion} />
        ))}
      </div>
    </div>
  );
};

export default Suggestions;
