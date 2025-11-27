const Domain = require('./Domain');
const Resource = require('./Resource');

async function getAllDomains() {
  const domains = await Domain.aggregate([
    {
      $lookup: {
        from: 'resources',
        localField: '_id',
        foreignField: 'domainId',
        as: 'resources',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        resourceCount: { $size: '$resources' },
      },
    },
    { $sort: { name: 1 } },
  ]);

  return domains.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    description: d.description,
    created_at: d.createdAt,
    resourceCount: d.resourceCount,
  }));
}

async function getDomainById(id) {
  const domain = await Domain.findById(id);
  if (!domain) return null;
  return {
    id: domain._id.toString(),
    name: domain.name,
    description: domain.description,
    created_at: domain.createdAt,
  };
}

async function createDomain({ name, description }) {
  const domain = new Domain({ name, description });
  await domain.save();
  return { changes: 1 };
}

async function updateDomain(id, { name, description }) {
  const domain = await Domain.findByIdAndUpdate(id, { name, description }, { new: true });
  return { changes: domain ? 1 : 0 };
}

async function deleteDomain(id) {
  const result = await Domain.deleteOne({ _id: id });
  return { changes: result.deletedCount };
}

async function domainHasResources(id) {
  const count = await Resource.countDocuments({ domainId: id });
  return count > 0;
}

module.exports = {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  domainHasResources,
};
