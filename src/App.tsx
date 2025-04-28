import WebViewHandler from './components/WebViewHandler'
import { CanvasGridPage } from './components/CanvasGridPage'
import ShowSensorDataAndButton from './components/ShowSensorDataAndButton'
import { CollectedDataStats } from './components/CollectedDataStats'

function App() {
  return (
    <div className="h-full overflow-auto relative">
      <ShowSensorDataAndButton />
      <WebViewHandler />


      <div className='fixed left-1/2 -translate-x-1/2 pointer-events-none w-full'>
        {CollectedDataStats}
      </div>
      <div className=' w-full overflow-auto h-[300px]'>
      <CanvasGridPage />

      </div>

      {/* Canvas */}
    </div>
  )
}

export default App