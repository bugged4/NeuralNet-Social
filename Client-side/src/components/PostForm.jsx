import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Icon, Image, Message, Segment } from 'semantic-ui-react';

import { api } from '../util/api';

function PostForm({ onPostCreated }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [values, setValues] = useState({
    body: '',
    tags: ''
  });
  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ''),
    [imageFile]
  );

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const onChange = (event) => {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  async function createPostCallback(event) {
    event.preventDefault();

    if (!values.body.trim()) {
      setError('Write something before posting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let image = '';

      if (imageFile) {
        const uploadResult = await api.uploadImage(imageFile);
        image = uploadResult.file.url;
      }

      const result = await api.createPost({
        body: values.body.trim(),
        image,
        tags: values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      });

      setValues({ body: '', tags: '' });
      setImageFile(null);

      if (onPostCreated) {
        onPostCreated(result.post);
      }
    } catch (err) {
      setError(err.errors ? Object.values(err.errors)[0] : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Segment className="composer">
      <Form onSubmit={createPostCallback} loading={loading}>
        <Form.TextArea
          name="body"
          placeholder="Share an update, idea, or question..."
          value={values.body}
          onChange={onChange}
          rows={4}
          maxLength={2000}
          error={Boolean(error)}
        />
        <Form.Input
          icon="hashtag"
          iconPosition="left"
          placeholder="ai, design, coding"
          name="tags"
          onChange={onChange}
          value={values.tags}
        />
        {imagePreview && (
          <div className="image-preview">
            <Image src={imagePreview} alt="Selected upload preview" rounded />
            <Button
              type="button"
              size="mini"
              basic
              icon="close"
              onClick={() => setImageFile(null)}
              aria-label="Remove selected image"
            />
          </div>
        )}
        <div className="composer-actions">
          <Button as="label" basic icon labelPosition="left" htmlFor="post-image">
            <Icon name="image" />
            Image
          </Button>
          <input
            id="post-image"
            className="file-input"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files[0] || null)}
          />
          <Button type="submit" color="teal" icon labelPosition="left" disabled={!values.body.trim()}>
            <Icon name="send" />
            Post
          </Button>
        </div>
      </Form>
      {error && <Message negative content={error} />}
    </Segment>
  );
}

export default PostForm;
