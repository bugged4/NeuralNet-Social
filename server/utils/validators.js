const emailRegex = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;

const validateRegisterInput = (username, email, password, confirmPassword) => {
  const errors = {};
  username = username ? username.trim() : '';
  email = email ? email.trim() : '';
  password = password || '';
  confirmPassword = confirmPassword || '';

  if (!username) {
    errors.username = 'Username must not be empty';
  } else if (username.length < 3 || username.length > 30) {
    errors.username = 'Username must be between 3 and 30 characters';
  }

  if (!email) {
    errors.email = 'Email must not be empty';
  } else if (!email.match(emailRegex)) {
    errors.email = 'Email must be a valid email address';
  }

  if (!password.trim()) {
    errors.password = 'Password must not be empty';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

const validateLoginInput = (username, password) => {
  const errors = {};
  username = username ? username.trim() : '';
  password = password || '';

  if (!username) {
    errors.username = 'Username must not be empty';
  }

  if (!password.trim()) {
    errors.password = 'Password must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput
};
