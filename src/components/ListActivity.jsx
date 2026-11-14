export default function ListActivity(props) {
  return (
    <div className="p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-xl flex items-center gap-4">
      
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-white"></div>
        <div className="w-0.5 h-6 bg-gray-200 my-0.5"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
      </div>

      <div className="flex flex-col justify-between space-y-3">
        <span className="text-sm text-gray-500 leading-none">{props.from}</span>
        <span className="text-sm font-semibold text-gray-800 leading-none">{props.to}</span>
      </div>

    </div>
  )
}
