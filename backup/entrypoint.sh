#!/bin/sh

sh backup.sh


# Define the crontab schedule inline
CRON_SCHEDULE="0 0 1 * * /backup/backup.sh"

# Write the crontab entry for the root user
echo "$CRON_SCHEDULE" > /etc/crontabs/root

# Start the cron daemon
echo "Starting cron daemon..."
crond -f
