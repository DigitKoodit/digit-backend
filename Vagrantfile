# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/bionic64"

  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  config.vm.network "forwarded_port", guest: 3001, host: 3001
  # Port for tests
  config.vm.network "forwarded_port", guest: 3031, host: 3031
  # Open Postgres port
  config.vm.network "forwarded_port", guest: 5432, host: 54321
  config.vm.network "forwarded_port", guest: 9230, host: 9230
  
  config.vm.define :default do |default|
    default.vm.provider "virtualbox" do |vb|
      vb.memory = "1024"
    end
  end

  config.vm.define :wsl, autostart: false do |wsl|
    wsl.vm.provider "virtualbox" do |vb|
      vb.memory = "1024"
      vb.customize [ "modifyvm", :id, "--uartmode1", "disconnected" ]
    end
  end

  config.vm.provision "shell", path: "vagrant/000-bootstrap.sh"
end