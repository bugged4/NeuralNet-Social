import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Container,
  Grid,
  Header,
  Icon,
  Input,
  Label,
  Loader,
  Message,
  Segment,
  Statistic
} from 'semantic-ui-react';

import { AuthContext } from '../context/auth';
import { api } from '../util/api';
import { API_URL, GRAPHQL_URL } from '../util/api';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';

const PAGE_SIZE = 9;

function Home() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [signals, setSignals] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({
    rest: { state: 'checking', label: 'Checking REST' },
    graphql: { state: 'checking', label: 'Checking GraphQL' }
  });

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      const [restResult, graphqlResult] = await Promise.allSettled([
        api.health({ signal: controller.signal }),
        api.graphqlHealth({ signal: controller.signal })
      ]);

      if (controller.signal.aborted) {
        return;
      }

      setStatus({
        rest: restResult.status === 'fulfilled'
          ? { state: 'online', label: 'REST online' }
          : { state: 'offline', label: restResult.reason?.message || 'REST unavailable' },
        graphql: graphqlResult.status === 'fulfilled'
          ? { state: 'online', label: 'GraphQL online' }
          : { state: 'offline', label: graphqlResult.reason?.message || 'GraphQL unavailable' }
      });
    }

    checkBackend();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setPosts([]);
      setPagination({ page: 1, pages: 1, total: 0 });
      return undefined;
    }

    const controller = new AbortController();

    async function loadPosts() {
      setLoading(true);
      setError('');

      try {
        const data = await api.getPosts({
          page,
          limit: PAGE_SIZE,
          signal: controller.signal
        });
        setPosts(data.posts || []);
        setPagination(data.pagination || { page, pages: 1, total: 0 });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPosts();

    return () => controller.abort();
  }, [page, user]);

  useEffect(() => {
    if (!user) {
      setRecommendations([]);
      setSignals(null);
      return undefined;
    }

    const controller = new AbortController();

    async function loadRecommendations() {
      setRecommendationLoading(true);

      try {
        const data = await api.getRecommendations({
          page: 1,
          limit: 5,
          signal: controller.signal
        });
        setRecommendations((data.recommendations || []).map((item) => item.post));
        setSignals(data.signals || null);
      } catch (_err) {
        setRecommendations([]);
        setSignals(null);
      } finally {
        setRecommendationLoading(false);
      }
    }

    loadRecommendations();

    return () => controller.abort();
  }, [user]);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return posts;
    }

    return posts.filter((post) => {
      const body = post.body?.toLowerCase() || '';
      const username = post.username?.toLowerCase() || '';
      const tags = (post.tags || []).join(' ').toLowerCase();
      return body.includes(query) || username.includes(query) || tags.includes(query);
    });
  }, [posts, search]);

  function handlePostCreated(post) {
    setPosts((current) => [post, ...current]);
    setPagination((current) => ({
      ...current,
      total: current.total + 1
    }));
  }

  function handlePostDeleted(postId) {
    setPosts((current) => current.filter((post) => post.id !== postId));
    setRecommendations((current) => current.filter((post) => post.id !== postId));
  }

  function handlePostUpdated(updatedPost) {
    setPosts((current) => current.map((post) => (
      post.id === updatedPost.id ? updatedPost : post
    )));
    setRecommendations((current) => current.map((post) => (
      post.id === updatedPost.id ? updatedPost : post
    )));
  }

  return (
    <Container className="home-page">
      <section className="feed-header">
        <div>
          <Header as="h1">NeuralNet Social</Header>
          <p>Fast posts, image sharing, likes, recommendations, and GraphQL reads from your backend API.</p>
        </div>
        <Input
          icon="search"
          placeholder="Filter this page..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      {!user && (
        <Segment className="center-state" style={{ padding: '3rem' }}>
          <Header as="h2" icon>
            <Icon name="lock" />
            Authentication Required
          </Header>
          <p>Please log in to view posts and connect with the community.</p>
          <Button
            as={Link}
            to="/login"
            primary
            size="large"
            style={{ marginRight: '1rem' }}
          >
            Log In
          </Button>
          <Button
            as={Link}
            to="/register"
            secondary
            size="large"
          >
            Register
          </Button>
        </Segment>
      )}

      {user && (
        <Grid stackable columns={2}>
          <Grid.Column width={10}>
            <PostForm onPostCreated={handlePostCreated} />

            <div className="section-heading">
              <Header as="h2">Recent Posts</Header>
              <Label basic>
                {pagination.total} total
              </Label>
            </div>

          {loading && (
            <Segment className="center-state">
              <Loader active inline="centered" content="Loading posts" />
            </Segment>
          )}

          {!loading && error && (
            <Message negative icon className="api-error">
              <Icon name="warning sign" />
              <Message.Content>
                <Message.Header>Could not load posts</Message.Header>
                <p>{error}</p>
                <p className="muted small-text">The frontend is currently using {API_URL}.</p>
              </Message.Content>
            </Message>
          )}

          {!loading && !error && visiblePosts.length === 0 && (
            <Segment className="center-state">
              <Icon name="newspaper outline" size="large" />
              <p>{search ? 'No posts match this filter.' : 'No posts yet. Start the conversation.'}</p>
            </Segment>
          )}

          {!loading && !error && visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))}

          {!loading && !error && pagination.pages > 1 && (
            <div className="pagination-bar">
              <Button
                basic
                icon
                labelPosition="left"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <Icon name="chevron left" />
                Newer
              </Button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <Button
                basic
                icon
                labelPosition="right"
                disabled={page >= pagination.pages}
                onClick={() => setPage((value) => value + 1)}
              >
                Older
                <Icon name="chevron right" />
              </Button>
            </div>
            )}
          </Grid.Column>

          <Grid.Column width={6}>
          <aside className="side-rail">
            <Segment className="api-card">
              <div className="status-card-header">
                <Header as="h3">Backend Status</Header>
                <Label basic color={status.rest.state === 'online' && status.graphql.state === 'online' ? 'teal' : 'orange'}>
                  {status.rest.state === 'online' && status.graphql.state === 'online' ? 'Connected' : 'Check setup'}
                </Label>
              </div>
              <p>REST handles auth, posts, likes, uploads, and recommendations. GraphQL powers composed read queries.</p>
              <div className="endpoint-list">
                <div className={`endpoint-row ${status.rest.state}`}>
                  <Icon name={status.rest.state === 'online' ? 'check circle' : 'circle notched'} />
                  <div>
                    <strong>{status.rest.label}</strong>
                    <span>{API_URL}</span>
                  </div>
                </div>
                <div className={`endpoint-row ${status.graphql.state}`}>
                  <Icon name={status.graphql.state === 'online' ? 'check circle' : 'circle notched'} />
                  <div>
                    <strong>{status.graphql.label}</strong>
                    <span>{GRAPHQL_URL}</span>
                  </div>
                </div>
              </div>
              <Statistic.Group size="mini" widths="two" className="feed-stats">
                <Statistic>
                  <Statistic.Value>{posts.length}</Statistic.Value>
                  <Statistic.Label>Loaded</Statistic.Label>
                </Statistic>
                <Statistic>
                  <Statistic.Value>{pagination.total}</Statistic.Value>
                  <Statistic.Label>Total</Statistic.Label>
                </Statistic>
              </Statistic.Group>
            </Segment>

            {user && (
              <Segment className="recommendation-card">
                <div className="section-heading">
                  <Header as="h3">Recommended</Header>
                  {recommendationLoading && <Loader active inline size="tiny" />}
                </div>
                {recommendations.length === 0 && !recommendationLoading && (
                  <p className="muted">Like posts or add tags to improve recommendations.</p>
                )}
                {recommendations.map((post) => (
                  <Link
                    key={post.id}
                    className="recommendation-item"
                    to={`/posts/${post.id}`}
                  >
                    <strong>{post.username}</strong>
                    <span>{post.body}</span>
                  </Link>
                ))}
                {signals?.topTags?.length > 0 && (
                  <div className="tag-row compact">
                    {signals.topTags.slice(0, 5).map((item) => (
                      <Label key={item.tag} basic color="teal" size="tiny">
                        #{item.tag}
                      </Label>
                    ))}
                  </div>
                )}
              </Segment>
              )}
            </aside>
          </Grid.Column>
        </Grid>
      )}
    </Container>
  );
}

export default Home;
