import gaussian from 'gaussian'
const ndarray = require('ndarray')
const ops = require('ndarray-ops')

const fxrand: () => number = (window as any).fxrand
type def = (n: number, fn: () => number) => number[]
const gauss = gaussian(0, 1)

export const sleep = (s: number) => new Promise((r) => setTimeout(r, s))

export const getRandomZ = (dims = [1, 128]): NdArray => {
  const ndims = dims.reduce((a, b) => a * b, 1)
  const z = Float32Array.from((gauss.random as def)(ndims, fxrand))
  return ndarray(z, dims)
}

export const getZeros = (dims = [1, 128]): NdArray => {
  const ndims = dims.reduce((a, b) => a * b, 1)
  const a = Float32Array.from(Array(ndims).fill(0))
  return ndarray(a, dims)
}

export const getRandomGrid = (nX = 2, nY = 2, ndims = 128) => {
  const grid: NdArray[][] = [[]]
  for (let y = 0; y < nY; y++) {
    for (let x = 0; x < nX; x++) {
      if (!grid[x]) {
        grid[x] = []
      }
      grid[x][y] = getRandomZ([1, ndims])
    }
  }
  return grid
}

export const getCircularInterpolatedGrid = (
  gridA: NdArray[][],
  gridB: NdArray[][],
  gridC: NdArray[][],
  l = 0.5,
  radius = 100
) => {
  const grid: NdArray[][] = [[]]
  for (let y = 0; y < gridA[0].length; y++) {
    for (let x = 0; x < gridA.length; x++) {
      if (!grid[x]) {
        grid[x] = []
      }
      // Circular interpolation. Based on:
      // https://github.com/dvschultz/stylegan2-ada-pytorch/blob/main/generate.py#L76
      const a = gridA[x][y]
      const b = gridB[x][y]
      const c = gridC[x][y]

      const latentAxisX = getZeros(a.shape)
      ops.sub(latentAxisX, a, b)
      ops.divseq(latentAxisX, ops.norm1(latentAxisX))
      const latentAxisY = getZeros(a.shape)
      ops.sub(latentAxisY, a, c)
      ops.divseq(latentAxisY, ops.norm1(latentAxisY))

      const latentX = Math.sin(l * Math.PI * 2) * radius
      const latentY = Math.cos(l * Math.PI * 2) * radius

      const latent = getZeros(a.shape)
      ops.addeq(latent, a)
      ops.mulseq(latentAxisX, latentX)
      ops.addeq(latent, latentAxisX)
      ops.mulseq(latentAxisY, latentY)
      ops.addeq(latent, latentAxisY)
      grid[x][y] = latent
    }
  }
  return grid
}

// Lerp2D util
export const lerp2DFn = (numLatent: number) => {
  const tTL = getZeros([1, numLatent])
  const tTR = getZeros([1, numLatent])
  const tBL = getZeros([1, numLatent])
  const tBR = getZeros([1, numLatent])
  return (
    dest: NdArray,
    zTL: NdArray,
    zTR: NdArray,
    zBL: NdArray,
    zBR: NdArray,
    lX: number,
    lY: number
  ) => {
    const lTL = (1 - lX) * (1 - lY)
    ops.muls(tTL, zTL, lTL)
    const lTR = lX * (1 - lY)
    ops.muls(tTR, zTR, lTR)
    const lBL = (1 - lX) * lY
    ops.muls(tBL, zBL, lBL)
    const lBR = lX * lY
    ops.muls(tBR, zBR, lBR)
    // Add
    ops.add(dest, tTL, tTR)
    ops.addeq(dest, tBL)
    ops.addeq(dest, tBR)
  }
}
