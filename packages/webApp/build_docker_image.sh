#!/usr/bin/env bash
npm run build
cd ..
docker build -f webApp/Dockerfile -t webapp:test .