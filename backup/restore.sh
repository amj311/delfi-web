#!/bin/sh

PROJECT="delfi"
BACKUP_DIR="${HOME}/backups/${PROJECT}"
VOLUME="delfi-db"
 
POSTGRES_USER="postgres" # Replace with your database user
POSTGRES_PASS="password" # Replace with your database password
POSTGRES_HOST="db" # Replace with your database host
POSTGRES_PORT="5432" # Replace with your database port
POSTGRES_DB="delfi" # Replace with your database port


MODE="$1"
BACKUP_FILE="$2"

echo "Mode: ${MODE}"
echo "Backup file: ${BACKUP_FILE}"

# Check if the script should run locally or remotely
if [ "$MODE" = "--remote" ]; then

	# Load SSH vars
	if [[ -f .env.deploy ]]; then
		. .env.deploy
	fi

	echo -e "\nExecuting restore on remote server ${SSH_HOST}..."
	ssh ${SSH_USER}@${SSH_HOST} "bash -s -- --local '$BACKUP_FILE'" <"$0"
	exit $?
fi

# Use the provided backup file path if given, otherwise find the most recent backup
if [ -n "$BACKUP_FILE" ]; then
	echo "Using the provided backup file: ${BACKUP_FILE}"
else
	echo "Finding the most recent backup file in ${BACKUP_DIR}..."
	BACKUP_FILE=$(ls -t ${BACKUP_DIR}/${PROJECT}_${VOLUME}_*.tar 2>/dev/null | head -n 1)

	if [ -z "$BACKUP_FILE" ]; then
		echo "No backup files found in ${BACKUP_DIR}."
		exit 1
	fi

fi

echo -e "\nRestoring the backup: ${BACKUP_FILE}..."

# CLOSE ALL EXISTING CONNECTIONS
PGPASSWORD=$POSTGRES_PASS psql -h db -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();"
# RUN THE DUMP FILE
PGPASSWORD=$POSTGRES_PASS psql -h db -U $POSTGRES_USER -f ${BACKUP_FILE}

echo -e "\nRestoration completed for volume '${VOLUME}' from ${BACKUP_FILE}."
