#!/bin/sh

# load env vars from file if present
# Otherwise they should already be present
if [[ -f .env.deploy ]]; then
	. .env.deploy
fi

VERBOSE=$1
OUT=/dev/null

if [[ "$VERBOSE" == "-v" ]]; then
	OUT=/dev/stdout
fi

# Run docker compose on host, force build and recreate
DOCKER_HOST=ssh://${SSH_USER}@${SSH_HOST} docker compose -f docker-compose-prod.yml up -d --build --force-recreate > $OUT

echo -e "\nCleaning up...\n"
# Post build cleanup
DOCKER_HOST=ssh://${SSH_USER}@${SSH_HOST} docker system prune -f --filter "label=com.docker.compose.project=delfi-web" > $OUT

echo "Finished!"
exit 0