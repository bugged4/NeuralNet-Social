const Post = require('../models/Post');
const User = require('../models/User');

const MAX_POOL_SIZE = 250;
const DAY_MS = 24 * 60 * 60 * 1000;

const clampPagination = (page, limit) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit
  };
};

const idString = (value) => {
  if (!value) {
    return '';
  }

  return String(value._id || value.id || value);
};

const addWeightedTags = (target, tags, weight) => {
  (tags || []).forEach((tag) => {
    if (!tag) {
      return;
    }

    const normalized = String(tag).trim().toLowerCase();
    target.set(normalized, (target.get(normalized) || 0) + weight);
  });
};

const buildUserSignals = async (userId) => {
  if (!userId) {
    return {
      user: null,
      followedUserIds: new Set(),
      likedPostIds: new Set(),
      tagWeights: new Map()
    };
  }

  const user = await User.findById(userId).select('following').lean();

  if (!user) {
    return {
      user: null,
      followedUserIds: new Set(),
      likedPostIds: new Set(),
      tagWeights: new Map()
    };
  }

  const followedUserIds = new Set((user.following || []).map(idString));

  const [likedPosts, recentOwnPosts, followedPosts] = await Promise.all([
    Post.find({ 'likes.user': userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('_id tags user')
      .lean(),
    Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('tags')
      .lean(),
    followedUserIds.size > 0
      ? Post.find({ user: { $in: [...followedUserIds] } })
          .sort({ createdAt: -1 })
          .limit(50)
          .select('tags')
          .lean()
      : []
  ]);

  const tagWeights = new Map();
  const likedPostIds = new Set();

  likedPosts.forEach((post) => {
    likedPostIds.add(idString(post._id));
    addWeightedTags(tagWeights, post.tags, 5);
  });

  recentOwnPosts.forEach((post) => addWeightedTags(tagWeights, post.tags, 3));
  followedPosts.forEach((post) => addWeightedTags(tagWeights, post.tags, 2));

  return {
    user,
    followedUserIds,
    likedPostIds,
    tagWeights
  };
};

const engagementScore = (post) => {
  const likes = Number(post.likeCount || (post.likes || []).length || 0);
  const comments = Number(post.commentCount || (post.comments || []).length || 0);

  return Math.log1p(likes * 2 + comments * 3) * 8;
};

const recencyScore = (post) => {
  const createdAt = new Date(post.createdAt || post.updatedAt || Date.now()).getTime();
  const ageDays = Math.max((Date.now() - createdAt) / DAY_MS, 0);

  return Math.max(0, 18 - ageDays * 1.5);
};

const scorePost = (post, signals) => {
  let score = 0;
  const reasons = [];
  const authorId = idString(post.user);
  const matchingTags = [];

  if (signals.followedUserIds.has(authorId)) {
    score += 30;
    reasons.push('from_followed_user');
  }

  (post.tags || []).forEach((tag) => {
    const normalized = String(tag).toLowerCase();
    const tagWeight = signals.tagWeights.get(normalized) || 0;

    if (tagWeight > 0) {
      score += tagWeight * 6;
      matchingTags.push(normalized);
    }
  });

  if (matchingTags.length > 0) {
    reasons.push(`shared_tags:${[...new Set(matchingTags)].slice(0, 4).join(',')}`);
  }

  const engagement = engagementScore(post);
  const recency = recencyScore(post);

  score += engagement + recency;

  if (engagement >= 8) {
    reasons.push('high_engagement');
  }

  if (recency >= 12) {
    reasons.push('recent_activity');
  }

  if (reasons.length === 0) {
    reasons.push('trending_recent');
  }

  return {
    score,
    reasons
  };
};

const buildCandidateQuery = (userId, signals) => {
  const query = {};
  const excludedIds = [...signals.likedPostIds];

  if (excludedIds.length > 0) {
    query._id = { $nin: excludedIds };
  }

  if (userId) {
    query.user = { $ne: userId };
  }

  return query;
};

const getRecommendedPosts = async ({ userId, page = 1, limit = 10 } = {}) => {
  const pagination = clampPagination(page, limit);
  const signals = await buildUserSignals(userId);
  const query = buildCandidateQuery(userId, signals);
  const candidateLimit = Math.max(MAX_POOL_SIZE, pagination.skip + pagination.limit);

  const candidates = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(candidateLimit)
    .populate('user')
    .populate('likes.user')
    .populate('comments.user')
    .lean();

  const ranked = candidates
    .map((post) => {
      const ranking = scorePost(post, signals);

      return {
        post,
        score: Number(ranking.score.toFixed(3)),
        reasons: ranking.reasons
      };
    })
    .sort((a, b) => b.score - a.score);

  const total = ranked.length;
  const items = ranked.slice(pagination.skip, pagination.skip + pagination.limit);

  return {
    items,
    pageInfo: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < total,
      hasPreviousPage: pagination.page > 1
    },
    signals: {
      followedUserCount: signals.followedUserIds.size,
      likedPostCount: signals.likedPostIds.size,
      topTags: [...signals.tagWeights.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, weight]) => ({ tag, weight }))
    }
  };
};

module.exports = {
  getRecommendedPosts
};
