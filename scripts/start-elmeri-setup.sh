#!/bin/sh

USERNAME=ubuntu
SERVER_URL=elmeri.digit.fi

echo "Copy server_setup_files to the ${SERVER_URL}"
rsync -avz --delete server_setup_files/ ${USERNAME}@${SERVER_URL}:~/server_setup_files

# Start the setup on the server
ssh ${USERNAME}@${SERVER_URL} 'bash -s' < ./server_setup_files/setup-elmeri.sh

