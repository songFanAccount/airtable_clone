const TitlesRow = () => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row items-center h-[19.5px] gap-x-6">
        <div className="w-[500px] max-w-[500px]">
          <span className="text-[14px] text-gray-600">Name</span>
        </div>
        <div className="flex flex-row gap-x-6 items-center pr-[57px] min-w-[333=px] flex-1">
          <span className="text-[14px] text-gray-600 flex-1 min-w-[130px]">Last opened</span>
          <span className="text-[14px] text-gray-600 flex-1 min-w-[130px]">Workspace</span>
        </div>
      </div>
      <hr className="w-full my-[6.5px]"
        style={{
          borderColor: "#e0e1e1"
        }}
      />
    </div>
  )
}
const BasesList = () => {
  return (
    <div className="flex flex-col px-1">
      <TitlesRow/>
    </div>
  )
}
export default BasesList