#!/bin/sh

PROJECT="delfi"
BACKUP_DIR="/backup-dir/${PROJECT}"
DB_HOST="db" # Replace with your database host
DB_PORT="5432" # Replace with your database port
FILE_NAME="${PROJECT}_db_$(date +%Y-%m-%d_%H-%M-%S).sql"

# Create the backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "\nCreating backup for database ${DB_NAME}..."

# Use pg_dump to back up the database
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -d $POSTGRES_DB --create --clean --if-exists -f ${BACKUP_DIR}/${FILE_NAME}

echo -e "\nCreated backup for database '${POSTGRES_DB}' at ${BACKUP_DIR}/${FILE_NAME}. Check above for any errors."