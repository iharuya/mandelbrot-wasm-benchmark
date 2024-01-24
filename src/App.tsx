import { useCallback, useEffect, useRef, useState } from "react";
import { isMandelbrotSet as isMandelbrotSetJs } from "./mandelbrot";
import initWasm, { is_mandelbrot_set as isMandelbrotSetWasm } from '../mandelbrot-wasm/pkg'

type Benchmark = {
  status: "idle" | "running" | "done",
  type: "js" | "wasm" | null,
  renderCount: number,
  startTime: number,
  endTime: number,
}
const defaultBenchmark: Benchmark = {
  status: "idle",
  type: null,
  renderCount: 0,
  startTime: 0,
  endTime: 0,
}
function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState({ iterations: 5 })
  const [benchmark, setBenchmark] = useState(defaultBenchmark)

  const clear = useCallback(() => {
    setBenchmark(defaultBenchmark)
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [])

  const render = useCallback(async (count: number, isMandelbrotSet: (x: number, y: number) => number) => {
    return new Promise<void>((resolve) => {
      const _render = (iteration: number) => {
        if (!isInitialized || iteration <= 0) {
          resolve()
          return
        }

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!
        const magnificationFactor = 200;
        const panX = 4;
        const panY = 2;
        const width = canvas.width;
        const height = canvas.height;

        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const belongsToSet = isMandelbrotSet(x / magnificationFactor - panX, y / magnificationFactor - panY);
            if (belongsToSet === 0) {
              ctx.fillStyle = '#000';
              ctx.fillRect(x, y, 1, 1);
            } else {
              ctx.fillStyle = `hsl(0, 100%, ${belongsToSet}%)`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        setBenchmark((prev) => ({
          ...prev,
          renderCount: prev.renderCount + 1,
        }))

        requestAnimationFrame(() => _render(iteration - 1));
      }
      _render(count);
    })
  }, [isInitialized])

  const takeBenchmark = useCallback(async (type: "js" | "wasm") => {
    clear()
    setBenchmark((prev) => ({
      ...prev,
      type,
      status: "running",
      startTime: performance.now(),
    }))
    if (type === "js") {
      await render(config.iterations, isMandelbrotSetJs);
    } else if (type === "wasm") {
      await render(config.iterations, isMandelbrotSetWasm)
    }
    setBenchmark((prev) => ({
      ...prev,
      status: "done",
      endTime: performance.now(),
    }))
  }, [render, config])


  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!
    // DPR Optimization
    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    // fill canvas with gray
    ctx.fillStyle = '#ccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    initWasm().then(() => {
      setIsInitialized(true);
    })
  }, [])

  return (
    <main className="p-4">
      <h1 className='text-2xl'>Mandelbrot Benchmark</h1>
      <div className="container">

        <label htmlFor="minmax-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Iteration Count</label>
        <div className="flex items-center space-x-2">
          <input
            id="minmax-range"
            type="range"
            min={1} max={20}
            value={config.iterations}
            onChange={(e) => setConfig((prev) => ({ ...prev, iterations: Number(e.target.value) }))}
            disabled={benchmark.status === "running"}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
          <span className="text-xl">{config.iterations}</span>
        </div>

      </div>
      {isInitialized && (
        <div className="container">
          <div className="flex space-x-2">
            <button
              onClick={clear}
              disabled={benchmark.status === "running"}
              className="text-white bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:focus:ring-yellow-900 disabled:opacity-50"
            >Reset</button>
            <button onClick={() => takeBenchmark("js")}
              disabled={benchmark.status === "running"}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50"
            >Render with JS</button>
            <button onClick={() => takeBenchmark("wasm")}
              disabled={benchmark.status === "running"}
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 disabled:opacity-50"
            >Render with WASM</button>
          </div>
          <div>
            <p>Benchmark status: {benchmark.status}</p>
            {benchmark.status !== "idle" && (
              <>
                <p>Type: {benchmark.type}</p>
                <p>Rendering count: {benchmark.renderCount}/{config.iterations}</p>
              </>
            )}
            {benchmark.status === "done" && (
              <>
                <p>Time elapsed: {benchmark.endTime - benchmark.startTime}ms</p>
              </>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} width="1280" height="720"></canvas>
    </main>
  )
}

export default App
