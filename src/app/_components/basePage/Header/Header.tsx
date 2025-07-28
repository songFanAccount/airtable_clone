import BaseInfoCorner from "./BaseInfoCorner"
import BasePanelModes from "./BasePanelModes"
import RightCorner from "./RightCorner"

interface HeaderProps {
  baseId?: string,
  baseName?: string
}
const Header = ({ baseId, baseName } : HeaderProps) => {
  return (
    <div
      className="flex min-w-[489px] w-full border-b-[1px] bg-white"
      style={{ borderColor: "hsl(0, 0.00%, 98.40%)" }}
    >
      <div
        className="flex justify-between items-center h-[56px] min-h-[56px]"
        style={{
          minWidth: "489px",
          width: "100%",
          overflowX: "clip",
          boxShadow:
            "0px 0px 1px rgba(0, 0, 0, 0.32), 0px 0px 2px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.08)",
          borderColor: "hsl(202, 10%, 88%)",
        }}
      >
        <div className="flex-1 flex flex-row justify-start"><BaseInfoCorner baseId={baseId} baseName={baseName}/></div>
        <div className="flex-1 flex flex-row justify-center h-full"><BasePanelModes/></div>
        <div className="flex-1 flex flex-row justify-end"><RightCorner/></div>
      </div>
    </div>
  )
}
export default Header