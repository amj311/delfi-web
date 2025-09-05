#!/bin/sh

echo "Giving DB time to initialize..."
sleep 10

echo "Running initial backup..."
sh backup.sh

echo "Setting up cron job for backups..."
# Define the crontab schedule inline
CRON_SCHEDULE="0 0 1 * * /backup/backup.sh"

# Write the crontab entry for the root user
echo "$CRON_SCHEDULE" > /etc/crontabs/root

# Start the cron daemon
echo "Starting cron daemon..."
crond -f
