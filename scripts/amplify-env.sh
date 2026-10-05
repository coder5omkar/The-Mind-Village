#!/usr/bin/env bash
# Write selected build-time environment variables into .env.production so the
# Next.js server runtime can read them. Amplify does not pass console
# environment variables to the SSR compute by default - this is the documented
# workaround.
set -e

for name in \
  DATABASE_URL \
  NEXTAUTH_URL \
  NEXTAUTH_SECRET \
  GOOGLE_CLIENT_ID \
  GOOGLE_CLIENT_SECRET \
  JEV_API_KEY \
  JEV_API_URL \
  JEV_MODEL \
  DEEPSEEK_API_KEY \
  DEEPSEEK_BASE_URL \
  DEEPSEEK_MODEL
do
  value="${!name:-}"
  if [ -n "$value" ]; then
    printf '%s=%s\n' "$name" "$value" >> .env.production
  fi
done

echo "Wrote .env.production with:"
cut -d= -f1 .env.production | sort
