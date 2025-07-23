import LogoCorner from "./LogoCorner";
import SearchBar from "./SearchBar";
import InfoCorner from "./InfoCorner";

const Header = () => {
  return (
    <div
      className="flex flex-col min-w-[489px] w-full border-b-[1px] bg-white"
      style={{ borderColor: "hsl(0, 0.00%, 98.40%)" }}
    >
      <div
        className="flex items-center h-[56px] min-h-[56px] pl-[8px] pr-[16px]"
        style={{
          minWidth: "489px",
          width: "100%",
          overflowX: "clip",
          boxShadow:
            "0px 0px 1px rgba(0, 0, 0, 0.32), 0px 0px 2px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.08)",
          borderColor: "hsl(202, 10%, 88%)",
        }}
      >
        <LogoCorner />
        <SearchBar />
        <InfoCorner />
      </div>
    </div>
  );
};

export default Header;