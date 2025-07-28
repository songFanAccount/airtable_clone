import { toastNoFunction } from "~/hooks/helpers"

const Mode = ({ text, onClick, isSelected } : { text: string, onClick: () => void, isSelected: boolean }) => {
  return (
    <button className="h-full cursor-pointer border-box"
      onClick={onClick}
      style={{
        borderBottom: isSelected ? "2px solid #8c3f78" : undefined
      }}
    >
      <span className="text-[13px] font-[500] relative"
        style={{
          color: isSelected ? "black" : "rgb(97, 102, 112)",
          top: isSelected ? "1px" : 0
        }}
      >
        {text}
      </span>
    </button>
  )
}
const BasePanelModes = () => {
  return (
    <div className="flex flex-row items-center h-full gap-4">
      {["Data", "Automations", "Interfaces", "Forms"].map((modeText, index) => <Mode key={index} text={modeText} isSelected={index === 0} onClick={() => {if (index !== 0) toastNoFunction()}} />)}
    </div>
  )
}
export default BasePanelModes