# NeuralNet Social API

Phase 1 uses REST for commands and operational endpoints, with GraphQL mounted at `/graphql` for composed read screens.

REST handles auth, protected writes, likes, uploads, and health checks. GraphQL handles home feed, explore feed, profile composition, comments tree, and multi-entity search.

## Folder Structure

```text
server/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── likeController.js
│   ├── postController.js
│   ├── recommendationController.js
│   └── uploadController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── loggerMiddleware.js
│   └── uploadMiddleware.js
├── graphql/
│   ├── authContext.js
│   ├── index.js
│   ├── resolvers.js
│   └── typeDefs.js
├── models/
│   ├── Post.js
│   ├── upload.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── likeRoutes.js
│   ├── postRoutes.js
│   ├── recommendationRoutes.js
│   └── uploadRoutes.js
├── services/
│   ├── moderationService.js
│   └── recommendationService.js
├── uploads/
├── utils/
│   ├── generateToken.js
│   └── validators.js
├── .env.example
├── package.json
└── server.js
```

## Environment

Create `server/.env` from `.env.example`:

```text
MONGODB=mongodb+srv://USER:PASSWORD@HOST/DATABASE?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
UPLOAD_MAX_BYTES=5242880
```

## Endpoints

### Auth

`POST /api/auth/register`

```json
{
  "username": "krishna",
  "email": "krishna@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

`POST /api/auth/login`

```json
{
  "username": "krishna",
  "password": "password123"
}
```

`GET /api/auth/me`

Header:

```text
Authorization: Bearer <token>
```

Example auth response:

```json
{
  "success": true,
  "user": {
    "id": "USER_ID",
    "username": "krishna",
    "email": "krishna@example.com",
    "createdAt": "2026-05-07T18:00:00.000Z",
    "token": "JWT_TOKEN"
  }
}
```

### Posts

`GET /api/posts?page=1&limit=10`

`GET /api/posts/:id`

`POST /api/posts`

Header:

```text
Authorization: Bearer <token>
```

Body:

```json
{
  "body": "My first REST post"
}
```

`DELETE /api/posts/:id`

Header:

```text
Authorization: Bearer <token>
```

Example posts response:

```json
{
  "success": true,
  "posts": [
    {
      "id": "POST_ID",
      "body": "My first REST post",
      "username": "krishna",
      "likeCount": 0,
      "commentCount": 0,
      "likes": [],
      "comments": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Likes

`PUT /api/posts/:id/like`

Header:

```text
Authorization: Bearer <token>
```

The endpoint toggles like/unlike and prevents duplicate likes because one username can only appear once in the embedded `likes` array.

Example response:

```json
{
  "success": true,
  "liked": true,
  "post": {
    "id": "POST_ID",
    "likeCount": 1
  }
}
```

### Uploads

`POST /api/uploads`

Headers:

```text
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Postman body:

```text
form-data
file: <image file>
```

Example response:

```json
{
  "success": true,
  "file": {
    "filename": "uuid.png",
    "originalName": "profile.png",
    "mimetype": "image/png",
    "size": 12345,
    "url": "http://localhost:5000/uploads/uuid.png"
  }
}
```

### Recommendations

`GET /api/recommendations/posts?page=1&limit=10`

Header:

```text
Authorization: Bearer <token>
```

Recommendations are produced by the independent `services/recommendationService.js` layer. It currently uses deterministic ranking signals so it is safe for production and easy to replace later with an AI ranking microservice.

Signals used:

- liked posts
- followed users
- shared tags/interests
- engagement
- recent activity

Example response:

```json
{
  "success": true,
  "recommendations": [
    {
      "post": {
        "id": "POST_ID",
        "body": "AI tools for creators",
        "tags": ["ai", "creators"],
        "likeCount": 12,
        "commentCount": 3
      },
      "score": 72.41,
      "reasons": ["from_followed_user", "shared_tags:ai", "high_engagement"]
    }
  ],
  "pageInfo": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "signals": {
    "followedUserCount": 4,
    "likedPostCount": 9,
    "topTags": [{ "tag": "ai", "weight": 20 }]
  }
}
```

## GraphQL

GraphQL endpoint:

```text
POST /graphql
```

Optional header for personalized queries:

```text
Authorization: Bearer <token>
```

### Home Feed

```graphql
query HomeFeed {
  homeFeed(page: 1, limit: 10) {
    items {
      id
      body
      image
      tags
      username
      likeCount
      commentCount
      user {
        id
        username
      }
    }
    pageInfo {
      page
      limit
      total
      hasNextPage
    }
  }
}
```

### Explore Feed

```graphql
query ExploreFeed {
  exploreFeed(page: 1, limit: 10, tag: "ai") {
    items {
      id
      body
      tags
      likeCount
    }
  }
}
```

If a JWT is sent and no `tag` or `search` is supplied, the resolver lightly personalizes results from tags the user recently posted.

### Recommended Posts

```graphql
query RecommendedPosts {
  recommendedPosts(page: 1, limit: 10) {
    items {
      score
      reasons
      post {
        id
        body
        tags
        likeCount
        commentCount
        user {
          id
          username
        }
      }
    }
    signals {
      followedUserCount
      likedPostCount
      topTags {
        tag
        weight
      }
    }
    pageInfo {
      page
      total
      hasNextPage
    }
  }
}
```

`recommendedPosts` requires `Authorization: Bearer <token>`. `exploreFeed` also uses the same recommendation service when an authenticated request does not provide `tag` or `search`.

### Profile Page

```graphql
query Profile {
  profile(username: "krishna", page: 1, limit: 10) {
    user {
      id
      username
      followerCount
      followingCount
      followers {
        id
        username
      }
    }
    posts {
      items {
        id
        body
      }
    }
  }
}
```

### Comments Tree

```graphql
query CommentsTree {
  commentsTree(postId: "POST_ID") {
    id
    text
    username
    replies {
      id
      text
      username
    }
  }
}
```

### Search

```graphql
query Search {
  search(q: "ai", type: "ALL", page: 1, limit: 10) {
    items {
      ... on User {
        id
        username
      }
      ... on Post {
        id
        body
        tags
      }
    }
    pageInfo {
      total
      pages
    }
  }
}
```

## Migration Notes

- GraphQL is now intentionally read-focused instead of replacing REST.
- REST `POST /api/auth/register` and `POST /api/auth/login` remain the source of tokens.
- REST post and like routes remain the write path.
- GraphQL feed/search/profile queries use the same MongoDB `User` and `Post` models.
- REST and GraphQL recommendation endpoints both call the same service layer, so future AI ranking can be added in one place.
- Uploads are REST-only and served from `/uploads/:filename`.
- `services/recommendationService.js` and `services/moderationService.js` are placeholders for future AI microservices.
