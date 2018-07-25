![Logo of the project](https://digit.fi/images/site/logo_screen_new.gif)

# Digit - Backend

Node backend for handling student organization Digit website. 

## Installing / Getting started

1. Install VirtualBox
2. Install latest Vagrant version (tested with 2.0.3)
3. Install/ensure Node/NPM is installed (prefer NVM)

```shell
git clone <your fork url>/digit-backend
cd digit-backend
nvm use 
vagrant up
```

Vagrant creates Ubuntu 18 virtual machine and installs postgres and other dependencies required on the project. See [Vagrantfile](./Vagrantfile)

**NOTE** If using Linux subsystem for Windows instead of `vagrant up` run `vagrant up wsl`. The command starts vagrant with proper configs.

### Initial Configuration

(Use VScode)

## Developing

Access development environment within Vagrant:

`vagrant ssh default` 

*replace `default` with `wsl` if using Windows Subsystem for Linux*

TODO 

### Building

TODO

### Deploying / Publishing

TODO

## Features

* JWT authentication/registration
* Static Markdown/HTML page content
* Sponsors
* Navigation

## Configuration

TODO

## Contributing

> Fork the project -> do changes -> make a pull request.

### 1. Clone your fork:

    git clone git@github.com:YOUR-USERNAME/digit-backend.git

### 2. Add remote from original repository in your forked repository: 

    cd into/cloned/fork-repo
    git remote add upstream git://github.com/digitkoodit/digit-backend.git
    git fetch upstream

### 3. Updating your fork from original repo to keep up with their changes:

    git pull upstream master

### 4. Making your own changes
    git push origin master

### 5. Make a pull request on GitHub 

## Links

TODO


## Licensing

"The code in this project is licensed under [MIT license.](/LICENSE)"