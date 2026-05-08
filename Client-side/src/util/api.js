const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const GRAPHQL_URL = `${API_URL}/graphql`;

const getToken = () => localStorage.getItem('jwtToken');

const normalizeError = (data, fallback) => {
  if (data && data.errors) {
    return data.errors;
  }

  return {
    general: (data && data.message) || fallback || 'Something went wrong'
  };
};

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch (_err) {
    throw new Error('Cannot reach the API server. Check that the backend is running on port 5000.');
  }

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (_err) {
    data = { message: text || 'Invalid server response' };
  }

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.errors = normalizeError(data, error.message);
    throw error;
  }

  return data;
};

const queryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });

  const value = searchParams.toString();
  return value ? `?${value}` : '';
};

const graphql = async ({ query, variables = {}, signal }) => {
  const token = getToken();

  let response;

  try {
    response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ query, variables })
    });
  } catch (_err) {
    throw new Error('Cannot reach the GraphQL server. Check that the backend is running on port 5000.');
  }

  const data = await response.json();

  if (!response.ok || data.errors) {
    const message = data.errors?.[0]?.message || 'GraphQL request failed';
    throw new Error(message);
  }

  return data.data;
};

export const api = {
  health: () => request('/api/health'),

  login: (values, options) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(values),
    ...options
  }),

  register: (values, options) => request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(values),
    ...options
  }),

  me: () => request('/api/auth/me'),

  getPosts: ({ page = 1, limit = 12, signal } = {}) => request(
    `/api/posts${queryString({ page, limit })}`,
    { signal }
  ),

  getPost: (id, options) => request(`/api/posts/${id}`, options),

  createPost: (values, options) => request('/api/posts', {
    method: 'POST',
    body: JSON.stringify(values),
    ...options
  }),

  deletePost: (id, options) => request(`/api/posts/${id}`, {
    method: 'DELETE',
    ...options
  }),

  toggleLike: (id, options) => request(`/api/posts/${id}/like`, {
    method: 'PUT',
    ...options
  }),

  getRecommendations: ({ page = 1, limit = 6, signal } = {}) => request(
    `/api/recommendations/posts${queryString({ page, limit })}`,
    { signal }
  ),

  uploadImage: (file, options) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/api/uploads', {
      method: 'POST',
      body: formData,
      ...options
    });
  },

  graphql,

  exploreFeed: ({ page = 1, limit = 10, tag = '', search = '', signal } = {}) => graphql({
    signal,
    query: `
      query ExploreFeed($page: Int!, $limit: Int!, $tag: String, $search: String) {
        exploreFeed(page: $page, limit: $limit, tag: $tag, search: $search) {
          items {
            id
            body
            image
            tags
            username
            likeCount
            commentCount
            createdAt
            updatedAt
            likes { id user { id username } }
          }
          pageInfo {
            page
            limit
            total
            pages
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `,
    variables: { page, limit, tag: tag || null, search: search || null }
  })
};

export { API_URL, GRAPHQL_URL };
