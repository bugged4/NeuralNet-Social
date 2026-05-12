import React, { useContext, useState } from 'react';
import { Button, Form, Message, Segment } from 'semantic-ui-react';

import { AuthContext } from '../context/auth';
import { api } from '../util/api';

function CommentForm({ postId, onCommentAdded }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      setError('Please write a comment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.createComment(postId, {
        text: commentText.trim()
      });

      setCommentText('');
      if (onCommentAdded) {
        onCommentAdded(result.comment);
      }
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Segment>
        <Message info>
          <Message.Header>Sign in to comment</Message.Header>
          <p>You need to be logged in to add comments.</p>
        </Message>
      </Segment>
    );
  }

  return (
    <Segment>
      {error && (
        <Message negative>
          <Message.Header>Error</Message.Header>
          {error}
        </Message>
      )}
      <Form onSubmit={handleSubmit} loading={loading}>
        <Form.TextArea
          name="commentText"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
        />
        <Button type="submit" color="blue" floated="right">
          Post Comment
        </Button>
      </Form>
    </Segment>
  );
}

export default CommentForm;
