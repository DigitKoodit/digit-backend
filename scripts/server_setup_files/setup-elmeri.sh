#!/bin/sh
# Elmeri Ubuntu server setup

echo "Start the initialization on the server ${PWD}"

# Update the system:
sudo apt update
sudo apt install -y build-essential
sudo timedatectl set-timezone Europe/Helsinki

# Install libraries
cd ~
sudo apt install -y git 
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs

# User and permissions
sudo adduser digit --disabled-password
sudo usermod -aG www-data digit
sudo mkdir -p /var/www
sudo chown -R www-data:www-data /var/www
sudo chmod -R 775 /var/www/

# Authentication and ssh access
sudo mkdir -p /home/digit/.ssh
sudo chmod 700 /home/digit/.ssh
sudo cp ~/.ssh/authorized_keys /home/digit/.ssh/
sudo chmod 600 /home/digit/.ssh/authorized_keys
sudo cp -r ~/server_setup_files /home/digit/
sudo chown -R digit:digit /home/digit

# Setup project
sudo npm install -g pm2
sudo su - digit
mkdir -p /var/www/digit_api
ln -s /var/www/digit_api digit_api

git init --bare ~/digit_api.git
cp ~/server_setup_files/post-receive ~/digit_api.git/hooks/post-receive

# # CI 
# git push --force ssh://digit@elmeri.digit.fi/~/digit_api.git ${BRANCH}

# # Local development
# git remote add production digit@elmeri.digit.fi:~/digit_api.git
# git push production ${BRANCH}

echo "Server setup complete"