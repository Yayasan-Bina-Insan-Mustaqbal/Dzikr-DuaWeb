#!/bin/bash
# Deployment script for Dzikr & Dua

echo "Syncing files to production server..."
# Using rsync to copy the project to the server, excluding heavy/local folders
sshpass -p 'cemara153' rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.output' \
  --exclude '.tanstack' \
  --exclude '.bun' \
  ./ root@100.103.32.88:/opt/dzikr-dua/

echo "Starting Docker containers on production..."
# SSH in and run docker compose
sshpass -p 'cemara153' ssh -o StrictHostKeyChecking=no root@100.103.32.88 "cd /opt/dzikr-dua && cp .env.production .env && docker compose -f docker-compose.prod.yml up -d --build"

echo "Deployment complete! Application should be running at http://100.103.32.88:3000"
