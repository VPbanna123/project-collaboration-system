#!/bin/bash

echo "Building all microservices..."

# Build each service
for service in chat-service notification-service project-service team-service user-service; do
  echo "Building $service..."
  cd services/$service
  npm run build
  if [ $? -eq 0 ]; then
    echo "✓ $service built successfully"
  else
    echo "✗ $service build failed"
    exit 1
  fi
  cd ../..
done

echo "All services built successfully!"
