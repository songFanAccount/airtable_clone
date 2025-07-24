import { FaReact as OmniIcon } from "react-icons/fa";
import { PiGridFour as TemplatesIcon, PiTable as NewAppIcon } from "react-icons/pi";
import { GoArrowUp as UploadIcon } from "react-icons/go";

interface SuggestionInfo {
  Icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
}

const SuggestionBox = ({ info }: { info: SuggestionInfo }) => {
  const { Icon, iconColor, title, description } = info;
  return (
    <div
      className="flex flex-col bg-white border rounded-[6px] p-4 w-full"
      style={{
        borderColor: "hsl(202, 10%, 88%)",
        boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div className="flex flex-row items-center">
        <Icon className="w-[20px] h-[20px] flex-shrink-0" style={{ color: iconColor }} />
        <p className="ml-2 font-semibold text-[16px]">{title}</p>
      </div>
      <p className="text-[14px] text-[#616670] mt-1">{description}</p>
    </div>
  );
};

const Suggestions = () => {
  const suggestions: SuggestionInfo[] = [
    {
      Icon: OmniIcon,
      iconColor: "#dd04a8",
      title: "Start with Omni",
      description: "Use AI to build a custom app tailored to your workflow.",
    },
    {
      Icon: TemplatesIcon,
      iconColor: "#63498d",
      title: "Start with templates",
      description: "Select a template to get started and customize as you go.",
    },
    {
      Icon: UploadIcon,
      iconColor: "#0d7f78",
      title: "Quickly upload",
      description: "Easily migrate your existing projects in just a few minutes.",
    },
    {
      Icon: NewAppIcon,
      iconColor: "#3b66a3",
      title: "Build an app on your own",
      description: "Start with a blank app and build your ideal workflow.",
    },
  ];

  return (
    <div className="w-full overflow-x-auto mb-6">
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
