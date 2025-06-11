#!/bin/sh

# Check if the script should run locally or remotely
if [ "$1" = "--remote" ]; then

	# Load SSH vars
	if [[ -f .env.deploy ]]; then
		. .env.deploy
	fi

	echo -e "\nExecuting restore on remote server ${SSH_HOST}..."
	ssh ${SSH_USER}@${SSH_HOST} "bash -s" <"$0"
	exit $?
fi

sudo docker exec delfi-backup sh backup.sh