const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401);
    throw new Error('Authorization header must be provided');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401);
    throw new Error("Authentication token must be 'Bearer [token]'");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (err) {
    res.status(401);
    throw new Error('Invalid/Expired token');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(401);
    throw new Error('User no longer exists');
  }

  req.user = user;
  next();
});

module.exports = {
  protect
};
