import { InferenceSession, Tensor } from 'onnxruntime-web'
const ndarray = require('ndarray')

let map: InferenceSession | undefined
let synth: InferenceSession | undefined

export interface Model {
  load: () => Promise<void>
  run: (z: Tensor) => Promise<Tensor>
  latent: number
}

/**
 * Load the Moon model.
 */
async function load() {
  map = await InferenceSession.create('./moon-map.onnx', {
    executionProviders: ['wasm'],
  })
  synth = await InferenceSession.create('./moon-synth.onnx', {
    executionProviders: ['wasm'],
  })
}

/**
 * Generates a moon based on the latent vector.
 * @param z A latent vector.
 * @returns {NdArray} The raw image data.
 */
async function run(z: Tensor) {
  if (!map || !synth) {
    throw new Error('model is not loaded')
  }
  const { style } = await map.run({ var: z })
  const results = await synth.run({ style })
  const res = ndarray(results.img.data, results.img.dims)
  return res
}

const model: Model = {
  load,
  run,
  latent: 256,
}
export default model
