/*
  # Enable pg_net extension for CRON job

  1. Purpose
    - Enable pg_net extension required for net.http_post() in CRON jobs
    - This allows the CRON job to make HTTP requests to edge functions
  
  2. Changes
    - Create pg_net extension
*/

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
