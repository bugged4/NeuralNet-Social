import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Button,
  Card,
  Container,
  Header,
  Icon,
  Image,
  Label,
  Loader,
  Message,
  Segment
} from 'semantic-ui-react';

import { AuthContext } from '../context/auth';
import { api } from '../util/api';
import LikeButton from '../components/LikeButton';
import DeleteButton from '../components/DeleteButton';
import CommentForm from '../components/CommentForm';
import MyPopup from '../util/MyPopup';

dayjs.extend(relativeTime);

function SinglePost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadPost() {
      setLoading(true);
      setError('');

      try {
        const data = await api.getPost(postId, { signal: controller.signal });
        setPost(data.post);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPost();

    return () => controller.abort();
  }, [postId]);

  function deletePostCallback() {
    navigate('/');
  }

  if (loading) {
    return (
      <Container>
        <Segment className="center-state">
          <Loader active inline="centered" content="Loading post" />
        </Segment>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Message negative icon>
          <Icon name="warning sign" />
          <Message.Content>
            <Message.Header>Could not load this post</Message.Header>
            {error}
          </Message.Content>
        </Message>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container>
        <Segment className="center-state">
          <Icon name="search" size="large" />
          <p>Post not found.</p>
          <Button as={Link} to="/" basic>
            Back to feed
          </Button>
        </Segment>
      </Container>
    );
  }

  const {
    id,
    body,
    createdAt,
    username,
    comments = [],
    likes,
    likeCount,
    commentCount,
    image,
    tags = []
  } = post;

  return (
    <Container className="post-detail-page">
      <Button as={Link} to="/" basic icon labelPosition="left" className="back-button">
        <Icon name="arrow left" />
        Feed
      </Button>

      <Card fluid className="post-card detail-card">
        <Card.Content>
          <div className="post-author">
            <div className="avatar-fallback large">{username?.charAt(0).toUpperCase()}</div>
            <div>
              <Header as="h2">{username}</Header>
              <Card.Meta>{createdAt ? dayjs(createdAt).fromNow() : 'just now'}</Card.Meta>
            </div>
          </div>
          {image && <Image src={image} fluid rounded className="detail-image" />}
          <Card.Description className="post-body detail-body">{body}</Card.Description>
          {tags.length > 0 && (
            <div className="tag-row">
              {tags.map((tag) => (
                <Label key={tag} basic color="teal">
                  #{tag}
                </Label>
              ))}
            </div>
          )}
        </Card.Content>
        <Card.Content extra>
          <LikeButton
            user={user}
            post={{ id, likeCount, likes }}
            onPostUpdated={setPost}
          />
          <MyPopup content="Comments">
            <Button as="div" labelPosition="right" className="metric-button">
              <Button basic color="blue">
                <Icon name="comments" />
              </Button>
              <Label basic color="blue" pointing="left">
                {commentCount}
              </Label>
            </Button>
          </MyPopup>
          {user && user.username === username && (
            <DeleteButton postId={id} callback={deletePostCallback} />
          )}
        </Card.Content>
      </Card>

      <section className="comments-section">
        <Header as="h3">Comments ({comments.length})</Header>
        
        <CommentForm 
          postId={id} 
          onCommentAdded={(newComment) => {
            setPost(prev => ({
              ...prev,
              comments: [...prev.comments, newComment],
              commentCount: prev.commentCount + 1
            }));
          }}
        />

        {comments.length === 0 && (
          <Segment className="center-state">
            <p>No comments yet.</p>
          </Segment>
        )}
        {comments.map((comment) => (
          <Card fluid key={comment.id}>
            <Card.Content>
              <Card.Header>{comment.username}</Card.Header>
              <Card.Meta>
                {comment.createdAt ? dayjs(comment.createdAt).fromNow() : 'just now'}
              </Card.Meta>
              <Card.Description>{comment.text || comment.body}</Card.Description>
              {user && user.username === comment.username && (
                <Button 
                  size="mini" 
                  negative
                  icon="trash"
                  onClick={async () => {
                    try {
                      await api.deleteComment(id, comment.id);
                      setPost(prev => ({
                        ...prev,
                        comments: prev.comments.filter(c => c.id !== comment.id),
                        commentCount: prev.commentCount - 1
                      }));
                    } catch (err) {
                      console.error('Failed to delete comment:', err);
                    }
                  }}
                />
              )}
            </Card.Content>
          </Card>
        ))}
      </section>
    </Container>
  );
}

export default SinglePost;
