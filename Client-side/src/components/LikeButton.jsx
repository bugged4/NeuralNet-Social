import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Label, Icon } from 'semantic-ui-react';

import { api } from '../util/api';
import MyPopup from '../util/MyPopup';

function LikeButton({ user, post: { id, likeCount, likes }, onPostUpdated }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likeCount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && likes && likes.find((like) => {
      const likeUser = like.user || like;
      return likeUser.username === user.username || likeUser.id === user.id;
    })) {
      setLiked(true);
    } else setLiked(false);
    setCount(likeCount || 0);
  }, [user, likes, likeCount]);

  async function likePost() {
    if (!user) return;

    const optimisticLiked = !liked;
    setLoading(true);
    setLiked(optimisticLiked);
    setCount((value) => Math.max(0, value + (optimisticLiked ? 1 : -1)));

    try {
      const result = await api.toggleLike(id);
      setLiked(result.liked);
      setCount(result.post.likeCount);

      if (onPostUpdated) {
        onPostUpdated(result.post);
      }
    } catch (_err) {
      setLiked(liked);
      setCount(likeCount || 0);
    } finally {
      setLoading(false);
    }
  }

  const likeButton = user ? (
    liked ? (
      <Button color="teal" loading={loading}>
        <Icon name="heart" />
      </Button>
    ) : (
      <Button color="teal" basic loading={loading}>
        <Icon name="heart" />
      </Button>
    )
  ) : (
    <Button as={Link} to="/login" color="teal" basic>
      <Icon name="heart" />
    </Button>
  );

  return (
    <Button as="div" labelPosition="right" onClick={likePost} className="metric-button">
      <MyPopup content={liked ? 'Unlike' : 'Like'}>{likeButton}</MyPopup>
      <Label basic color="teal" pointing="left">
        {count}
      </Label>
    </Button>
  );
}

export default LikeButton;
