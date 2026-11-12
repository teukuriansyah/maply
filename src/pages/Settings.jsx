import { Wrench, Info } from 'lucide-react'
import BottomBar from '../components/BottomBar'

export default function Settings() {
  return (
    <div>
      <div className="px-5 py-2">
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <Wrench className="w-4 h-4 text-gray-700" />
          <span className="font-medium">Build</span>
        </div>
        
        <div className="bg-gray-300 p-2 rounded-lg">
          <div className="bg-white flex items-start gap-3 rounded-lg p-2.5">
            <Info className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">App Version</span>
              <span className="text-[12px] text-gray-600">Maply v.1.0.0 (Build 2026.11)</span>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 w-full">
        <BottomBar/>
      </div>
    </div>
  )
}
