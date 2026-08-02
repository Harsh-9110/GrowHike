#!/bin/bash

# Build script for GROW HIKE platform
echo "Building GROW HIKE..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build:frontend || vite build

# Build backend
echo "Building backend..."
npm run build:backend || esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"