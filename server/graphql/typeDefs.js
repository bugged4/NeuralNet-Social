const typeDefs = `#graphql
  type PageInfo {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type User {
    id: ID!
    username: String!
    email: String
    createdAt: String
    followers: [User!]!
    following: [User!]!
    followerCount: Int!
    followingCount: Int!
    posts(page: Int = 1, limit: Int = 10): PostConnection!
  }

  type Like {
    id: ID!
    user: User
    createdAt: String
  }

  type Comment {
    id: ID!
    user: User
    username: String!
    text: String!
    replies: [Comment!]!
    replyCount: Int!
    createdAt: String
    updatedAt: String
  }

  type Post {
    id: ID!
    user: User
    username: String!
    body: String!
    image: String
    tags: [String!]!
    likes: [Like!]!
    comments: [Comment!]!
    likeCount: Int!
    commentCount: Int!
    isEdited: Boolean!
    createdAt: String
    updatedAt: String
  }

  type PostConnection {
    items: [Post!]!
    pageInfo: PageInfo!
  }

  type Profile {
    user: User!
    posts: PostConnection!
    followers: [User!]!
    following: [User!]!
  }

  union SearchResult = User | Post

  type SearchConnection {
    items: [SearchResult!]!
    pageInfo: PageInfo!
  }

  type Query {
    homeFeed(page: Int = 1, limit: Int = 10): PostConnection!
    exploreFeed(page: Int = 1, limit: Int = 10, tag: String, search: String): PostConnection!
    profile(username: String!, page: Int = 1, limit: Int = 10): Profile
    commentsTree(postId: ID!): [Comment!]!
    search(q: String!, type: String = "ALL", page: Int = 1, limit: Int = 10): SearchConnection!
  }
`;

module.exports = typeDefs;
