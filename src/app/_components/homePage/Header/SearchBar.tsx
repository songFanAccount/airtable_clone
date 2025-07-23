import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const SearchBar = () => {
  return (
    <div className="flex items-center justify-center px-4 rounded-[20px] border border-gray-300 h-[32px] w-full min-w-[133px] max-w-[340px]">
      <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0"/>
      <input
        id="search-airtable"
        type="text"
        placeholder="Search..."
        className="flex-1 min-w-0 placeholder:text-[13px] ml-2"
      />
      <p className="whitespace-nowrap overflow-hidden flex-shrink-0 w-auto text-[13px] text-[#979AA0]">ctrl K</p>
    </div>
  );
};

export default SearchBar;