import React, { useState } from 'react';
import { Button, Confirm, Icon } from 'semantic-ui-react';

import { api } from '../util/api';
import MyPopup from '../util/MyPopup';

function DeleteButton({ postId, callback }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function deletePost() {
    setLoading(true);

    try {
      await api.deletePost(postId);
      setConfirmOpen(false);

      if (callback) {
        callback(postId);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MyPopup content="Delete post">
        <Button
          as="div"
          color="red"
          floated="right"
          loading={loading}
          onClick={() => setConfirmOpen(true)}
        >
          <Icon name="trash" style={{ margin: 0 }} />
        </Button>
      </MyPopup>
      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={deletePost}
      />
    </>
  );
}

export default DeleteButton;
