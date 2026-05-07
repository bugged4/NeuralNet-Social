const { GraphQLError } = require('graphql');

const Post = require('../models/Post');
const User = require('../models/User');

const clampPagination = (page, limit) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit
  };
};

const pageInfo = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1
});

const postConnection = async (query, page, limit, sort = { createdAt: -1 }) => {
  const pagination = clampPagination(page, limit);
  const [items, total] = await Promise.all([
    Post.find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('user')
      .populate('likes.user')
      .populate('comments.user')
      .lean(),
    Post.countDocuments(query)
  ]);

  return {
    items,
    pageInfo: pageInfo(pagination.page, pagination.limit, total)
  };
};

const userPostsConnection = (userId, page, limit) => {
  return postConnection({ user: userId }, page, limit);
};

const searchRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const resolvers = {
  SearchResult: {
    __resolveType(item) {
      return item.body !== undefined ? 'Post' : 'User';
    }
  },

  User: {
    id: (user) => user._id || user.id,
    email: (user, _args, context) => {
      const userId = String(user._id || user.id);
      return context.user && String(context.user._id) === userId ? user.email : null;
    },
    followers: async (user) => {
      if (!user.followers || user.followers.length === 0) {
        return [];
      }

      return User.find({ _id: { $in: user.followers } });
    },
    following: async (user) => {
      if (!user.following || user.following.length === 0) {
        return [];
      }

      return User.find({ _id: { $in: user.following } });
    },
    followerCount: (user) => (user.followers || []).length,
    followingCount: (user) => (user.following || []).length,
    posts: (user, args) => userPostsConnection(user._id || user.id, args.page, args.limit)
  },

  Post: {
    id: (post) => post._id || post.id,
    tags: (post) => post.tags || [],
    likes: (post) => post.likes || [],
    comments: (post) => post.comments || [],
    likeCount: (post) => post.likeCount || (post.likes || []).length,
    commentCount: (post) => post.commentCount || (post.comments || []).length,
    isEdited: (post) => Boolean(post.isEdited)
  },

  Like: {
    id: (like) => like._id || like.id,
    user: async (like) => {
      if (!like.user) {
        return null;
      }

      if (like.user.username) {
        return like.user;
      }

      return User.findById(like.user);
    }
  },

  Comment: {
    id: (comment) => comment._id || comment.id,
    user: async (comment) => {
      if (!comment.user) {
        return null;
      }

      if (comment.user.username) {
        return comment.user;
      }

      return User.findById(comment.user);
    },
    replies: (comment) => comment.replies || [],
    replyCount: (comment) => (comment.replies || []).length
  },

  Query: {
    homeFeed: (_parent, args) => {
      return postConnection({}, args.page, args.limit);
    },

    exploreFeed: async (_parent, args, context) => {
      const query = {};

      if (args.tag) {
        query.tags = args.tag.trim().toLowerCase();
      }

      if (args.search) {
        const regex = searchRegex(args.search.trim());
        query.$or = [
          { body: regex },
          { username: regex },
          { tags: regex }
        ];
      }

      // Personalized exploration stays intentionally simple for Phase 1:
      // prefer tags the current user has recently used, then fall back to recency.
      if (context.user && !args.tag && !args.search) {
        const recentUserPosts = await Post.find({ user: context.user._id })
          .sort({ createdAt: -1 })
          .limit(20)
          .select('tags')
          .lean();
        const preferredTags = [...new Set(recentUserPosts.flatMap((post) => post.tags || []))];

        if (preferredTags.length > 0) {
          query.tags = { $in: preferredTags };
        }
      }

      return postConnection(query, args.page, args.limit);
    },

    profile: async (_parent, args) => {
      const user = await User.findOne({ username: args.username })
        .populate('followers')
        .populate('following');

      if (!user) {
        return null;
      }

      return {
        user,
        posts: await userPostsConnection(user._id, args.page, args.limit),
        followers: user.followers || [],
        following: user.following || []
      };
    },

    commentsTree: async (_parent, args) => {
      const post = await Post.findById(args.postId)
        .select('comments')
        .populate('comments.user')
        .lean();

      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND', http: { status: 404 } }
        });
      }

      return post.comments || [];
    },

    search: async (_parent, args) => {
      const q = args.q ? args.q.trim() : '';

      if (!q) {
        throw new GraphQLError('Search query is required', {
          extensions: { code: 'BAD_USER_INPUT', http: { status: 400 } }
        });
      }

      const pagination = clampPagination(args.page, args.limit);
      const type = String(args.type || 'ALL').toUpperCase();
      const regex = searchRegex(q);
      const includeUsers = type === 'ALL' || type === 'USER' || type === 'USERS';
      const includePosts = type === 'ALL' || type === 'POST' || type === 'POSTS';

      const [users, posts, userTotal, postTotal] = await Promise.all([
        includeUsers
          ? User.find({
              $or: [{ username: regex }, { email: regex }]
            })
              .skip(pagination.skip)
              .limit(pagination.limit)
              .lean()
          : [],
        includePosts
          ? Post.find({
              $or: [{ body: regex }, { username: regex }, { tags: regex }]
            })
              .sort({ createdAt: -1 })
              .skip(pagination.skip)
              .limit(pagination.limit)
              .populate('user')
              .lean()
          : [],
        includeUsers ? User.countDocuments({ $or: [{ username: regex }, { email: regex }] }) : 0,
        includePosts
          ? Post.countDocuments({
              $or: [{ body: regex }, { username: regex }, { tags: regex }]
            })
          : 0
      ]);

      const items = [...users, ...posts].slice(0, pagination.limit);
      const total = userTotal + postTotal;

      return {
        items,
        pageInfo: pageInfo(pagination.page, pagination.limit, total)
      };
    }
  }
};

module.exports = resolvers;
