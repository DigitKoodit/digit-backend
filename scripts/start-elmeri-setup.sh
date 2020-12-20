#!/bin/sh

# Use identity from params or the default key file
IDENTITY_FILE=${1:-~/.ssh/id_rsa}
USERNAME=ubuntu
SERVER_URL=13.49.183.192 # EC2 private ip because elmeri.digit.fi doesn't work until ELB health check has succeeded

echo "Copy server_setup_files to the ${SERVER_URL}"
rsync -avz --delete server_setup_files/ -e "ssh -i ${IDENTITY_FILE}" ${USERNAME}@${SERVER_URL}:~/server_setup_files

# Start the setup on the server
ssh -i ${IDENTITY_FILE} ${USERNAME}@${SERVER_URL} 'bash -s' < ./server_setup_files/setup-elmeri.sh

