#!/bin/bash

echo $PRISMA_URL

# Print the current working directory
echo "Current working directory:"
pwd

# List the contents of the current directory
echo "Contents of the prisma directory:"
ls -al node_modules/prisma

npx prisma generate

npx prisma migrate deploy

node ./dist/main.js
