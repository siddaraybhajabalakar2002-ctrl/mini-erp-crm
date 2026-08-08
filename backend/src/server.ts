import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`🚀 Mini ERP + CRM Backend Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});
