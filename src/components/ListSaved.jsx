import { Trash2, Navigation } from 'lucide-react';

export default function ListSaved(props) {
  return (
    <div className="p-4 shadow-md rounded-lg w-full">
      <div className="flex flex-col">
        <span className="text-lg font-semibold">{props.name}</span>
        <span className="text-[12px] text-gray-500 capitalize break-words">{props.address}</span>
      </div>
      <div className="flex justify-between mt-4">
        <button className="flex items-center gap-1 bg-gray-500 aspect-square px-2 px-1 rounded-full" onClick={props.clear}><Trash2 size={16} color="white"/></button>
        <button className="bg-blue-700 text-white font-semibold rounded-full px-4 py-1 flex items-center gap-1.5"><Navigation size={14} /> Rute</button>
      </div>
    </div>
  )
}
