const path = require('path')
const fs = require('fs').promises

async function spit(filepath, data) {
  const dirpath = path.dirname(filepath)
  await fs.mkdir(dirpath, {recursive: true})
  return fs.writeFile(filepath, data)
}

/**
Write sourceContent to <dirpath>/<sourceRoot>/<source>.

Returns (a Promise of) the written filepath (on success).
*/
async function dumpSource(source, sourceContent, sourceRoot, dirpath) {
  const safeSource = source.replace(/[\x00-\x1f\x80-\x9f\?<>\\:\*\|"]/g, '')

  const sourcePath = path.normalize(safeSource)
  const sourceFilepath = path.join(dirpath, sourceRoot, sourcePath)

  await spit(sourceFilepath, sourceContent)

  return sourceFilepath
}

/**
Traverse a JavaScript Source Map, writing output into <dirpath>.

Returns (a Promise of) a list of strings of written filepaths.
*/
function dumpSourceMap({sources, sourcesContent, sourceRoot}, dirpath) {
  const sourcePromises = sources.map((source, i) => {
    const sourceContent = sourcesContent[i]
    return dumpSource(source, sourceContent, sourceRoot, dirpath)
  })
  return Promise.all(sourcePromises)
}

/**
Read a JavaScript Source Map from <filepath>, overriding the "sourceRoot" field
with <sourceRoot> if provided, and write output into <dirpath>.

Returns (a Promise of) a list of strings of written filepaths.
*/
async function dumpFile(filepath, dirpath, sourceRoot) {
  const sourceMapData = await fs.readFile(filepath)
  const sourceMap = JSON.parse(sourceMapData)
  if (sourceRoot) {
    Object.assign(sourceMap, {sourceRoot})
  }
  return dumpSourceMap(sourceMap, dirpath)
}

module.exports = {
  dumpSource,
  dumpSourceMap,
  dumpFile,
}
