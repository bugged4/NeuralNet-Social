import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Icon, Message, Segment } from 'semantic-ui-react';

import { AuthContext } from '../context/auth';
import { api } from '../util/api';
import { useForm } from '../util/hooks';

function Register() {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const { onChange, onSubmit, values } = useForm(registerUser, {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  async function registerUser() {
    setLoading(true);
    setErrors({});

    try {
      const data = await api.register(values);
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
          <Icon name="user plus" />
          <div>
            <h1>Create your account</h1>
            <p>Join the feed and start sharing ideas with the network.</p>
          </div>
        </div>
        <Form onSubmit={onSubmit} noValidate loading={loading}>
        <Form.Input
          label="Username"
          placeholder="3-30 characters"
          name="username"
          type="text"
          value={values.username}
          error={Boolean(errors.username)}
          onChange={onChange}
        />
        <Form.Input
          label="Email"
          placeholder="you@example.com"
          name="email"
          type="email"
          value={values.email}
          error={Boolean(errors.email)}
          onChange={onChange}
        />
        <Form.Input
          label="Password"
          placeholder="at least 8 characters"
          name="password"
          type="password"
          value={values.password}
          error={Boolean(errors.password)}
          onChange={onChange}
        />
        <Form.Input
          label="Confirm Password"
          placeholder="repeat your password"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          error={Boolean(errors.confirmPassword)}
          onChange={onChange}
        />
        <Button type="submit" primary fluid icon labelPosition="left">
          <Icon name="check circle" />
          Register
        </Button>
      </Form>
      {Object.keys(errors).length > 0 && (
        <Message negative list={Object.values(errors)} />
      )}
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Segment>
    </div>
  );
}

export default Register;
