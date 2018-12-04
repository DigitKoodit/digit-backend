const decorate = file => {
  const { file_id: id } = file
  const { filename, path, size, mimetype, createdAt, description } = file.file_data
  return { id, filename, path, size, mimetype, createdAt, description }
}

const decorateList = files =>
  files.map(decorate)

const decorateInitialList = files =>
  files.map(decorateInitial)

const decorateInitial = file => {
  const { mimetype, filename, path, size } = file
  return { filename, path, size, mimetype }
}

module.exports = {
  decorate,
  decorateList,
  decorateInitialList
}
