export function configuration(env = process.env) {
  const port = Number(env.PORT ?? 3000);
  const sessionHours = Number(env.SESSION_HOURS ?? 8);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe estar entre 1 y 65535.');
  if (!Number.isFinite(sessionHours) || sessionHours <= 0 || sessionHours > 168) throw new Error('SESSION_HOURS debe estar entre 0 (exclusivo) y 168.');
  const timeZone = env.BUSINESS_TIME_ZONE ?? 'America/La_Paz';
  new Intl.DateTimeFormat('en-US', { timeZone });
  const origins = (env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origins.length || origins.some((s) => !/^https?:\/\//.test(s) || new URL(s).origin !== s)) throw new Error('CORS_ORIGINS debe contener orígenes HTTP exactos separados por comas.');
  return { port, host: env.HOST ?? '127.0.0.1', databasePath: env.DATABASE_PATH ?? './data/pharmacy.sqlite', sessionHours, timeZone, origins };
}
