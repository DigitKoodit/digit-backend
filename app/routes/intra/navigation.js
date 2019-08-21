const router = require('express-promise-router')({ mergeParams: true });
const publicRouter = require('express-promise-router')();

const { findByIdToResultRow } = require('../../helpers/helpers');
const {
  validateCreate,
  validateUpdate
} = require('../../models/siteContent/navItemValidators');
const {
  decorate,
  decorateList
} = require('../../models/siteContent/navItemDecorators');
const {
  findById,
  findAll,
  save,
  remove
} = require('../../models/siteContent/navItemModel');

router.get('/', (req, res) =>
  findAll(req.db)
    .then(decorateList)
    .then(result => res.send(result))
);

router.get('/:navItemId', (req, res) => res.send(decorate(req.resultRow)));

router.post('/', validateCreate(), (req, res) => {
  console.log(req.body);
  let newItem = {
    ...req.body
  };
  return save(req.db, newItem)
    .then(decorate)
    .then(result => res.status(201).send(result));
});

router.put('/:navItemId', validateUpdate(), async (req, res) => {
  let parent = null;
  let toSave = null;
  if (req.body.parentId) {
    parent = await findById(req.db, req.body.parentId);
  }

  if (parent) {
    toSave = { ...req.body, path: parent.nav_item_data.path + req.body.path };
    const oldItem = decorate(req.resultRow);
    return save(req.db, { ...oldItem, ...toSave }, req.params.navItemId)
      .then(decorate)
      .then(result => res.send(result));
  }
});

router.delete('/:navItemId', (req, res) => {
  const { navItemId } = req.params;
  return remove(req.db, navItemId).then(id => res.status(204).send());
});

const findNavItemById = findByIdToResultRow('Nav item', 'navItemId', findById);

router.param('navItemId', findNavItemById);

publicRouter.get('/', (req, res) =>
  findAll(req.db, true)
    .then(decorateList)
    .then(result => res.send(result))
);

module.exports = {
  router,
  publicRouter
};
