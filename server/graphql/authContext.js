const jwt = require('jsonwebtoken');

const User = require('../models/User');

const getGraphQLUser = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    return User.findById(decoded.id);
  } catch (_err) {
    return null;
  }
};

module.exports = getGraphQLUser;
