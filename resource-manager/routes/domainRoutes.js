const express = require('express');
const domainController = require('../controllers/domainController');

const router = express.Router();

router.get('/', domainController.listDomains);
router.post('/', domainController.createDomain);
router.get('/:id/edit', domainController.renderEdit);
router.post('/:id/edit', domainController.updateDomainHandler);
router.post('/:id/delete', domainController.deleteDomainHandler);

module.exports = router;

