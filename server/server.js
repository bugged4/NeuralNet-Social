require('dotenv').config({ quiet: true });

const path = require('path');

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const connectDB = require('./config/db');
const createGraphQLMiddleware = require('./graphql');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const requestLogger = require('./middleware/loggerMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const assertRequiredEnv = () => {
  const requiredEnv = ['MONGODB', 'JWT_SECRET'];

  requiredEnv.forEach((name) => {
    if (!process.env[name]) {
      throw new Error(`${name} environment variable is required`);
    }
  });
};

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);

const startServer = async () => {
  assertRequiredEnv();
  await connectDB();

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'neuralnet-social-api'
    });
  });

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api', uploadRoutes);
  // REST owns authentication, writes, uploads, and operational APIs.
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/posts/:postId/comments', commentRoutes);
  app.use('/api/posts/:id', likeRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/uploads', uploadRoutes);

  // GraphQL is intentionally mounted as a composed read layer for screens that
  // need nested/dynamic data: feeds, profile, comments tree, and search.
  app.use('/graphql', await createGraphQLMiddleware());

  app.use(notFound);
  app.use(errorHandler);

  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`REST API running at http://localhost:${PORT}`);
      console.log(`GraphQL running at http://localhost:${PORT}/graphql`);
      resolve();
    });
  });
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer
};
