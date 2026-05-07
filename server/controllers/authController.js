const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const {
  validateRegisterInput,
  validateLoginInput
} = require('../utils/validators');

const userPayload = (user, token) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
  token
});

const registerUser = asyncHandler(async (req, res) => {
  let { username, email, password, confirmPassword } = req.body;
  const { valid, errors } = validateRegisterInput(
    username,
    email,
    password,
    confirmPassword
  );

  if (!valid) {
    res.status(400);
    throw new Error(JSON.stringify(errors));
  }

  username = username.trim();
  email = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) {
    res.status(409);
    throw new Error(
      existingUser.username === username ? 'Username is taken' : 'Email is taken'
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });

  res.status(201).json({
    success: true,
    user: userPayload(user, generateToken(user))
  });
});

const loginUser = asyncHandler(async (req, res) => {
  let { username, password } = req.body;
  const { valid, errors } = validateLoginInput(username, password);

  if (!valid) {
    res.status(400);
    throw new Error(JSON.stringify(errors));
  }

  username = username.trim();
  const user = await User.findOne({ username }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Wrong credentials');
  }

  res.status(200).json({
    success: true,
    user: userPayload(user, generateToken(user))
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt
    }
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe
};
