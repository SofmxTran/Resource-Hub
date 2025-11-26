const userModel = require('../models/userModel');

function showLeaderboard(req, res) {
  const leaderboard = userModel.getLeaderboard(20);
  
  // Calculate ranking scores for display
  const leaderboardWithScores = leaderboard.map((user, index) => {
    const score = (user.public_resource_count * 3) + (user.resource_count * 1) + (user.trust_score_sum * 2);
    return {
      ...user,
      rank: index + 1,
      score,
    };
  });
  
  res.render('users/leaderboard', {
    title: 'Leaderboard',
    leaderboard: leaderboardWithScores,
    activeNav: 'leaderboard',
  });
}

module.exports = {
  showLeaderboard,
};

