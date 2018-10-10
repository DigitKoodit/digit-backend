#!/bin/bash

sudo timedatectl set-timezone Europe/Helsinki

curl -sL https://deb.nodesource.com/setup_10.x | bash -
apt-get install -y build-essential nginx postgresql nodejs
sudo -u postgres psql -c "CREATE USER digit PASSWORD 'digit'"
sudo -u postgres createdb -O digit digit_dev
sudo -u postgres createdb -O digit digit_testing

sed -i -e "s/\#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/10/main/postgresql.conf
echo 'host    all             all             all                     md5' >> /etc/postgresql/10/main/pg_hba.conf

rm /vagrant/migrations/applied_*.json

npm install -g pm2 node-pre-gyp

cd /vagrant

sudo -u vagrant -H npm install
sudo -u vagrant -H npm rebuild

sudo -u vagrant -H NODE_ENV=development node /vagrant/db/migrate-up.js

sudo -u vagrant -H pm2 start /vagrant/digit_dev.config.js
sudo -u vagrant -H pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u vagrant --hp /home/vagrant

echo "alias log='pm2 logs'" >> /home/vagrant/.bashrc
echo "alias st='pm2 status'" >> /home/vagrant/.bashrc
echo "alias rst='pm2 restart all'" >> /home/vagrant/.bashrc
echo "alias rstl='pm2 restart all | pm2 logs'" >> /home/vagrant/.bashrc
echo "alias db='psql -U digit -h localhost'" >> /home/vagrant/.bashrc
echo "cd /vagrant" >> /home/vagrant/.bashrc