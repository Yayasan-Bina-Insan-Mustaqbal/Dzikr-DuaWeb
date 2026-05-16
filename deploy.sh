#!/bin/bash
# Deployment script for Dzikr & Dua using Tar
set -e

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DEPLOY_PASSWORD" ] || [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_PATH" ]; then
  echo "Error: DEPLOY_PASSWORD, DEPLOY_HOST, DEPLOY_USER, and DEPLOY_PATH must be set in .env"
  exit 1
fi

# Ensure critical assets exist
if [ ! -d "public/audios" ]; then
  echo "❌ Error: public/audios directory not found!"
  exit 1
fi

echo "Creating archive..."
tar -chzf /tmp/project.tar.gz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.output' \
  --exclude '.tanstack' \
  --exclude '.bun' \
  ./

echo "Uploading archive to production server..."
sshpass -p "$DEPLOY_PASSWORD" scp -o StrictHostKeyChecking=no /tmp/project.tar.gz "$DEPLOY_USER@$DEPLOY_HOST:/tmp/project.tar.gz"

echo "Extracting and building on production..."
sshpass -p "$DEPLOY_PASSWORD" ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $DEPLOY_PATH && cd $DEPLOY_PATH && tar -xzf /tmp/project.tar.gz && rm /tmp/project.tar.gz && cp .env.production .env && docker compose -f docker-compose.prod.yml up -d --build"

echo "Cleaning up local archive..."
rm /tmp/project.tar.gz

echo "Deployment complete! Application should be running at http://$DEPLOY_HOST:3000"
