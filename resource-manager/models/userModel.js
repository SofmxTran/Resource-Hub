const User = require('./User');

async function createUser({ fullName, email, passwordHash, username, isAdmin = false }) {
  const user = new User({
    fullName,
    email,
    passwordHash,
    username,
    isAdmin: isAdmin ? true : false,
  });
  await user.save();
  return {
    id: user._id.toString(),
    full_name: user.fullName,
    email: user.email,
    username: user.username,
    is_admin: user.isAdmin ? 1 : 0,
  };
}

async function findByEmail(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;
  return {
    id: user._id.toString(),
    full_name: user.fullName,
    email: user.email,
    username: user.username,
    password_hash: user.passwordHash,
    is_admin: user.isAdmin ? 1 : 0,
    display_name: user.displayName,
    avatar_path: user.avatarPath,
    bio: user.bio,
    website: user.website,
    created_at: user.createdAt,
  };
}

async function findByUsername(username) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) return null;
  return {
    id: user._id.toString(),
    full_name: user.fullName,
    email: user.email,
    username: user.username,
    password_hash: user.passwordHash,
    is_admin: user.isAdmin ? 1 : 0,
    display_name: user.displayName,
    avatar_path: user.avatarPath,
    bio: user.bio,
    website: user.website,
    created_at: user.createdAt,
  };
}

async function findById(id) {
  const user = await User.findById(id);
  if (!user) return null;
  return {
    id: user._id.toString(),
    full_name: user.fullName,
    email: user.email,
    username: user.username,
    password_hash: user.passwordHash,
    is_admin: user.isAdmin ? 1 : 0,
    display_name: user.displayName,
    avatar_path: user.avatarPath,
    bio: user.bio,
    website: user.website,
    created_at: user.createdAt,
  };
}

async function getUserCount() {
  return await User.countDocuments();
}

async function updateProfile(userId, { displayName, bio, website, avatarPath }) {
  const updateData = {};
  if (displayName !== undefined) updateData.displayName = displayName || null;
  if (bio !== undefined) updateData.bio = bio || null;
  if (website !== undefined) updateData.website = website || null;
  if (avatarPath !== undefined) updateData.avatarPath = avatarPath || null;

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
  return { changes: user ? 1 : 0 };
}

async function getLeaderboard(limit = 20) {
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'resources',
        localField: '_id',
        foreignField: 'userId',
        as: 'resources',
      },
    },
    {
      $lookup: {
        from: 'resourcevotes',
        localField: 'resources._id',
        foreignField: 'resourceId',
        as: 'votes',
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'resources._id',
        foreignField: 'resourceId',
        as: 'comments',
      },
    },
    {
      $project: {
        id: { $toString: '$_id' },
        username: 1,
        display_name: '$displayName',
        full_name: '$fullName',
        avatar_path: '$avatarPath',
        bio: 1,
        resource_count: { $size: '$resources' },
        public_resource_count: {
          $size: {
            $filter: {
              input: '$resources',
              as: 'r',
              cond: {
                $and: [
                  { $eq: ['$$r.isPublic', true] },
                  { $eq: ['$$r.status', 'APPROVED'] },
                ],
              },
            },
          },
        },
        trust_score_sum: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$resources',
                  as: 'r',
                  cond: {
                    $and: [
                      { $eq: ['$$r.isPublic', true] },
                      { $eq: ['$$r.status', 'APPROVED'] },
                    ],
                  },
                },
              },
              as: 'resource',
              in: {
                $let: {
                  vars: {
                    resourceVotes: {
                      $filter: {
                        input: '$votes',
                        as: 'v',
                        cond: { $eq: ['$$v.resourceId', '$$resource._id'] },
                      },
                    },
                  },
                  in: { $sum: '$$resourceVotes.value' },
                },
              },
            },
          },
        },
        comment_count: { $size: '$comments' },
        comments_given: {
          $size: {
            $filter: {
              input: '$comments',
              as: 'c',
              cond: { $eq: ['$$c.userId', '$_id'] },
            },
          },
        },
        created_at: '$createdAt',
      },
    },
    {
      $addFields: {
        ranking_score: {
          $add: [
            { $multiply: ['$public_resource_count', 3] },
            { $multiply: ['$resource_count', 1] },
            { $multiply: ['$trust_score_sum', 2] },
          ],
        },
      },
    },
    {
      $sort: { ranking_score: -1, created_at: 1 },
    },
    {
      $limit: limit,
    },
  ]);

  // Transform to match expected format
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    full_name: u.full_name,
    avatar_path: u.avatar_path,
    bio: u.bio,
    resource_count: u.resource_count,
    public_resource_count: u.public_resource_count,
    trust_score_sum: u.trust_score_sum || 0,
    comment_count: u.comment_count,
    comments_given: u.comments_given,
    created_at: u.created_at,
  }));
}

async function getUserStats(userId) {
  const mongoose = require('mongoose');
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const resourceStats = await require('./Resource').aggregate([
    { $match: { userId: userObjectId } },
    {
      $lookup: {
        from: 'resourcevotes',
        localField: '_id',
        foreignField: 'resourceId',
        as: 'votes',
      },
    },
    {
      $group: {
        _id: null,
        total_resources: { $sum: 1 },
        public_resources: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$isPublic', true] }, { $eq: ['$status', 'APPROVED'] }] },
              1,
              0,
            ],
          },
        },
        total_trust_score: { $sum: { $sum: '$votes.value' } },
      },
    },
  ]);

  const commentStats = await require('./Comment').aggregate([
    {
      $lookup: {
        from: 'resources',
        localField: 'resourceId',
        foreignField: '_id',
        as: 'resource',
      },
    },
    {
      $group: {
        _id: null,
        comments_received: {
          $sum: {
            $cond: [{ $eq: [{ $arrayElemAt: ['$resource.userId', 0] }, userObjectId] }, 1, 0],
          },
        },
        comments_given: {
          $sum: { $cond: [{ $eq: ['$userId', userObjectId] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    totalResources: resourceStats[0]?.total_resources || 0,
    publicResources: resourceStats[0]?.public_resources || 0,
    totalTrustScore: resourceStats[0]?.total_trust_score || 0,
    commentsReceived: commentStats[0]?.comments_received || 0,
    commentsGiven: commentStats[0]?.comments_given || 0,
  };
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  getUserCount,
  updateProfile,
  getLeaderboard,
  getUserStats,
};
