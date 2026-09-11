#!/bin/sh

# Check if .env.deploy exists and extract DATABASE_URL
if [[ -f .env.deploy ]]; then
    LINE=$(grep '^DATABASE_URL=' .env.deploy)
    if [[ -n "$LINE" ]]; then
        RAW_URL=${LINE#*=} # Gets everything after the first =
        DEPLOY_DB_URL="$RAW_URL"
        # Strip surrounding quotes if present (handling both single and double quotes)
        [[ "$DEPLOY_DB_URL" =~ ^[\'\"](.*)[\'\"]$ ]] && DEPLOY_DB_URL="${BASH_REMATCH[1]}"
    fi
fi

# Set the environment variable for the command execution context
export DATABASE_URL=${DEPLOY_DB_URL}

yarn db:push

exit 0