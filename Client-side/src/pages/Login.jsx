import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Icon, Message, Segment } from 'semantic-ui-react';

import { AuthContext } from '../context/auth';
import { api } from '../util/api';
import { useForm } from '../util/hooks';

function Login() {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  
  const { onChange, onSubmit, values } = useForm(loginUserCallback, {
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  async function loginUserCallback() {
    setLoading(true);
    setErrors({});

    try {
      const data = await api.login(values);
      context.login(data.user);
      navigate('/');
    } catch (err) {
      setErrors(err.errors || { general: err.message });
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="auth-page">
      <Segment className="auth-panel">
        <div className="auth-heading">
          <Icon name="lock" />
          <div>
            <h1>Welcome back</h1>
            <p>Sign in to create posts, like updates, and get recommendations.</p>
          </div>
        </div>
        <Form onSubmit={onSubmit} noValidate loading={loading}>
        <Form.Input
          label="Username"
          placeholder="your username"
          name="username"
          type="text"
          value={values.username}
          error={Boolean(errors.username)}
          onChange={onChange}
        />
        <Form.Input
          label="Password"
          placeholder="your password"
          name="password"
          type="password"
          value={values.password}
          error={Boolean(errors.password)}
          onChange={onChange}
        />
        <Button type="submit" primary fluid icon labelPosition="left">
          <Icon name="sign in" />
          Login
        </Button>
      </Form>
      {Object.keys(errors).length > 0 && (
        <Message negative list={Object.values(errors)} />
      )}
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </Segment>
    </div>
  );
}

export default Login;
