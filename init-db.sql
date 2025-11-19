-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE trivia_db TO trivia_user;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Set timezone
SET timezone = 'UTC';

-- You can add initial data here if needed
-- The TypeORM migrations will handle table creation
