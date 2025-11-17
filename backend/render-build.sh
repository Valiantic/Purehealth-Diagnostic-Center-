#!/usr/bin/env bash
# Render build script for database setup

echo "Installing dependencies..."
npm install

echo "Setting up database tables..."
npm run setup-db

echo "Build complete!"
