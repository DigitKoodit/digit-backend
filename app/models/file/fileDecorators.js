const decorate = file => {
  const { file_id: id } = file
  const { name, filename, filepath, createdAt } = file.file_data

  return {
    id,
    name,
    filename,
    filepath,
    createdAt
  }
}

const decorateList = files =>
  files.map(decorate)

module.exports = {
  decorate,
  decorateList
}
