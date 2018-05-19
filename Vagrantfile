# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"

  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  config.vm.network "forwarded_port", guest: 3001, host: 3001
  # open Postgres port
  config.vm.network "forwarded_port", guest: 5432, host: 54321
  
  config.vm.provider "virtualbox" do |vb|
   vb.memory = "1024"
  end
 
  config.vm.provision "shell", path: "vagrant/000-bootstrap.sh"
end
