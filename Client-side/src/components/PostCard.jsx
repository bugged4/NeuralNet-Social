import React, { useContext } from 'react';
import { Button, Card, Icon, Image, Label } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { AuthContext } from '../context/auth';
import LikeButton from './LikeButton';
import DeleteButton from './DeleteButton';
import MyPopup from '../util/MyPopup';

dayjs.extend(relativeTime);

function PostCard({
  post: { body, createdAt, id, username, likeCount, commentCount, likes, image, tags },
  onPostDeleted,
  onPostUpdated
}) {
  const { user } = useContext(AuthContext);

  return (
    <Card fluid className="post-card">
      <Card.Content>
        <div className="post-author">
          <div className="avatar-fallback">{username?.charAt(0).toUpperCase()}</div>
          <div>
            <Card.Header>{username}</Card.Header>
            <Card.Meta as={Link} to={`/posts/${id}`}>
              {createdAt ? dayjs(createdAt).fromNow() : 'just now'}
            </Card.Meta>
          </div>
        </div>
        {image && (
          <Link to={`/posts/${id}`} className="post-image-link">
            <Image src={image} fluid rounded />
          </Link>
        )}
        <Card.Description className="post-body">{body}</Card.Description>
        {tags && tags.length > 0 && (
          <Card.Meta className="tag-row">
            {tags.map((tag) => (
              <Label key={tag} basic size="tiny" color="teal">
                #{tag}
              </Label>
            ))}
          </Card.Meta>
        )}
      </Card.Content>
      <Card.Content extra>
        <LikeButton
          user={user}
          post={{ id, likes, likeCount }}
          onPostUpdated={onPostUpdated}
        />
        <MyPopup content="Comment on post">
          <Button labelPosition="right" as={Link} to={`/posts/${id}`} className="metric-button">
            <Button color="blue" basic>
              <Icon name="comments" />
            </Button>
            <Label basic color="blue" pointing="left">
              {commentCount}
            </Label>
          </Button>
        </MyPopup>
        {user && user.username === username && (
          <DeleteButton postId={id} callback={onPostDeleted} />
        )}
      </Card.Content>
    </Card>
  );
}

export default PostCard;
