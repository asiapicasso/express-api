try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {
  // Ignore missing dotenv
}

export const databaseUrl = process.env.DATABASE_URL;
export const port = process.env.PORT || '3000';
export const jwtSecret = process.env.JWT_SECRET;
export const bcryptFactor = 10;

