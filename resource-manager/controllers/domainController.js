const domainModel = require('../models/domainModel');

function listDomains(req, res) {
  const domains = domainModel.getAllDomains();
  res.render('domains/index', { title: 'Domains', domains });
}

function createDomain(req, res) {
  const { name, description } = req.body;
  if (!name) {
    req.session.error = 'Domain name is required.';
    return res.redirect('/domains');
  }

  try {
    domainModel.createDomain({ name, description });
    req.session.success = 'Domain created.';
  } catch (error) {
    req.session.error = 'Domain name must be unique.';
  }

  return res.redirect('/domains');
}

function renderEdit(req, res) {
  const domain = domainModel.getDomainById(req.params.id);
  if (!domain) {
    req.session.error = 'Domain not found.';
    return res.redirect('/domains');
  }
  res.render('domains/edit', { title: 'Edit Domain', domain });
}

function updateDomainHandler(req, res) {
  const { name, description } = req.body;
  try {
    domainModel.updateDomain(req.params.id, { name, description });
    req.session.success = 'Domain updated.';
  } catch (error) {
    req.session.error = 'Unable to update domain. Name may already exist.';
  }
  return res.redirect('/domains');
}

function deleteDomainHandler(req, res) {
  const { id } = req.params;
  if (domainModel.domainHasResources(id)) {
    req.session.error = 'Cannot delete: domain still has resources.';
    return res.redirect('/domains');
  }
  domainModel.deleteDomain(id);
  req.session.success = 'Domain deleted.';
  return res.redirect('/domains');
}

module.exports = {
  listDomains,
  createDomain,
  renderEdit,
  updateDomainHandler,
  deleteDomainHandler,
};

