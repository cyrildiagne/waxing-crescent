import GIF from '@dhdbstjr98/gif.js'
import { Tensor } from 'onnxruntime-web'
import model, { Model } from './model'
import { getMoonPhase, getMoonPhaseLabel } from './moon'
import {
  getCircularInterpolatedGrid,
  getRandomGrid,
  getZeros,
  lerp2DFn,
  sleep,
} from './utils'

const SIZE = 64
const MIN_NUM_GRID = 2
const MAX_NUM_GRID = 7
const CIRCULAR_INTERPOLATION_RADIUS = 200
const GIF_SIZE = 512
const FILTERS = 'saturate(1.25)'
const GIF_FRAMERATE = 25
const GIF_DURATION = 2

const global = window as any

const getNumSide = (v: number) => {
  if (v > 0.5) {
    return 20
  } else if (v > 0.2) {
    return 24
  } else {
    return 32
  }
}

const numX = getNumSide(global.fxrand())
const numY = numX

const rdmSpan = MAX_NUM_GRID - MIN_NUM_GRID
const numGrid = Math.round(global.fxrand() * rdmSpan) + MIN_NUM_GRID

global.$fxhashFeatures = {
  Grid: numX,
  Phases: numGrid,
}

async function render(
  ctx: CanvasRenderingContext2D,
  res: any,
  cx: number,
  cy: number
) {
  if (!ctx) {
    throw new Error('Could not get context')
  }
  const data = ctx.getImageData(cx, cy, SIZE, SIZE)
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      const r = ((res.get(0, 0, x, y) + 1.0) / 2.0) * 255
      const g = ((res.get(0, 1, x, y) + 1.0) / 2.0) * 255
      const b = ((res.get(0, 2, x, y) + 1.0) / 2.0) * 255
      const i = (y + x * SIZE) * 4
      data.data[i + 0] = r
      data.data[i + 1] = g
      data.data[i + 2] = b
      data.data[i + 3] = 255
    }
  }
  ctx.putImageData(data, cx, cy)
}

async function generate(
  ctx: CanvasRenderingContext2D,
  model: Model,
  grid: NdArray[][]
) {
  const z = getZeros([1, model.latent])
  const zt = new Tensor('float32', z.data, [1, model.latent])
  const lerp2D = lerp2DFn(model.latent)

  const totalX = grid.length
  const totalY = grid[0].length

  for (let y = 0; y < numY; y++) {
    for (let x = 0; x < numX; x++) {
      const gridX = (x / numX) * (totalX - 1)
      const gridY = (y / numY) * (totalY - 1)
      const nGridX = Math.floor(gridX)
      const nGridY = Math.floor(gridY)
      const lX = gridX % 1
      const lY = gridY % 1
      lerp2D(
        z,
        grid[nGridX][nGridY],
        grid[nGridX + 1][nGridY],
        grid[nGridX][nGridY + 1],
        grid[nGridX + 1][nGridY + 1],
        lX,
        lY
      )

      const res = await model.run(zt)
      await render(ctx, res, x * SIZE, y * SIZE)
      await sleep(1)
    }
  }
}

async function generateAnimation(
  ctx: CanvasRenderingContext2D,
  model: Model,
  gridA: NdArray[][],
  gridB: NdArray[][],
  gridC: NdArray[][],
  numFrames = 30
) {
  var gif = new GIF({
    workers: 2,
    quality: 10,
  })
  // Avoid dividing by zero if we have a single frame.
  numFrames = Math.max(numFrames, 1.00000001)
  const loader = document.querySelector('.loader') as HTMLElement
  const render = document.createElement('canvas')
  render.width = GIF_SIZE
  render.height = GIF_SIZE
  const renderCtx = render.getContext('2d')
  if (!renderCtx) {
    throw new Error('Could not get context')
  }
  if (FILTERS) {
    renderCtx.filter = FILTERS
  }
  for (let i = 0; i < numFrames; i++) {
    if (loader) {
      loader.dataset['progress'] = `${i + 1} / ${numFrames}`
    }
    const grid = getCircularInterpolatedGrid(
      gridA,
      gridB,
      gridC,
      i / (numFrames - 1),
      CIRCULAR_INTERPOLATION_RADIUS
    )
    await generate(ctx, model, grid)
    renderCtx.drawImage(
      ctx.canvas,
      0,
      0,
      renderCtx.canvas.width,
      renderCtx.canvas.height
    )
    gif.addFrame(renderCtx.canvas, { copy: true, delay: 1000 / GIF_FRAMERATE })
  }

  return new Promise<void>((resolve) => {
    if (loader) {
      loader.dataset['progress'] = ''
    }
    gif.on('finished', (blob: Blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `render.gif`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      resolve()
    })
    gif.render()
  })
}

async function main() {
  // Create the canvas.
  const canvas = document.createElement('canvas')
  canvas.id = 'render'
  canvas.width = SIZE * numX
  canvas.height = SIZE * numY
  if (FILTERS) {
    canvas.style.filter = FILTERS
  }
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get context')
  }
  try {
    console.log(`Features: ${JSON.stringify(global.$fxhashFeatures, null, 2)}`)

    await model.load()
    document.body.classList.add('loaded')

    const gridA = getRandomGrid(numGrid, numGrid, model.latent)
    const gridB = getRandomGrid(numGrid, numGrid, model.latent)
    const gridC = getRandomGrid(numGrid, numGrid, model.latent)

    const update = async () => {
      const phase = getMoonPhase(new Date())
      console.log(`Phase: ${phase.toFixed(2)} (${getMoonPhaseLabel(phase)})`)

      // Interpolate the grid based on the moon phase
      const grid = getCircularInterpolatedGrid(
        gridA,
        gridB,
        gridC,
        phase,
        CIRCULAR_INTERPOLATION_RADIUS
      )
      await generate(ctx, model, grid)
    }

    // Update every hour.
    setInterval(update, 1000 * 60 * 60)

    // Update now.
    update()

    // Generate the full animation on 'v' press.
    window.addEventListener('keydown', async (e) => {
      if (e.key === 'r') {
        if (!document.body.classList.contains('loaded')) {
          return
        }
        document.body.classList.remove('loaded')
        const numFrames = GIF_DURATION * GIF_FRAMERATE
        await generateAnimation(ctx, model, gridA, gridB, gridC, numFrames)
        // Revert back once complete.
        await update()
        document.body.classList.add('loaded')
      }
    })

    global.fxpreview()
  } catch (e) {
    console.error(e)
  }
}

main()
