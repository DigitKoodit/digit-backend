const sqlQueries = [
  `UPDATE nav_item SET nav_item_data = jsonb_set(nav_item_data, '{isPublished}', nav_item_data #>'{isVisible}')`,
  `UPDATE nav_item SET nav_item_data = jsonb_set(nav_item_data #- '{isVisible}', '{showOnNavigation}', nav_item_data #> '{isVisible}') WHERE nav_item_data #> '{}' ? 'isVisible'`
]
const sqlQueriesDown = [
  `UPDATE nav_item SET nav_item_data = jsonb_set(nav_item_data #- '{showOnNavigation}', '{isVisible}', nav_item_data #> '{showOnNavigation}') WHERE nav_item_data #> '{}' ? 'showOnNavigation'`,
  `UPDATE nav_item SET nav_item_data = nav_item_data #- '{isPublished}'`
]
module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
