#!/bin/bash
root_folder=$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)

cd $root_folder

# Load env variables
source ".env"

source "$root_folder/scripts/check_postgres_ready.sh"

docker-compose up -d db-development

# Check if PostgreSQL service is ready
if ! check_postgres_ready; then
    echo "PostgreSQL service is not ready. Exiting..."
    exit 1
fi

echo "PostgreSQL is ready"

OLD_PRISMA_URL=$PRISMA_URL
PRISMA_URL=$DEV_PRISMA_URL

export PRISMA_URL
echo "Overwrite PRISMA_URL: $PRISMA_URL"

echo "Run prisma generate"
npx prisma generate

npm run start:dev

#echo "db-development is down"

# Run the Docker command for migrations
# docker-compose run --rm db-testing prisma migrate deploy


echo "Restore PRISMA_URL: $OLD_PRISMA_URL"
PRISMA_URL=$OLD_PRISMA_URL
export PRISMA_URL

docker-compose stop db-development
