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

Open development environment within Vagrant:

`vagrant ssh default` 

*replace `default` with `wsl` if using Windows Subsystem for Linux* 

Project codes are located on `/vagrant` folder which opens automatically after SSH-connection. 

**Shell aliases**

> Following aliases are added to `~/.bashrc` during Vagrant initialization

| Command | Action                      | Notes                                                    |
| ------- | --------------------------- | -------------------------------------------------------- |
| st      | pm2 status                  |                                                          |
| log     | pm2 logs                    |                                                          |
| rst     | pm2 restart all             |                                                          |
| rstl    | pm2 restart all \| pm2 logs |                                                          |
| db      | psql -U digit -h localhost  | Add name of the database after alias e.g. `db digit_dev` |

### Testing

Ensure `.env` file is present in the project root and contains atleast following keys. These defaults are set on `digit_dev.config.js`

```
PORT=3001
TEST_PORT=3031
```

Test located in `/tests` folder on project root. Run tests with command `npm test`. More cli options available on Jest's [documents](https://jestjs.io/docs/en/cli.html) page

### Building

TODO

### Deploying / Publishing

TOOD

## Features

* JWT authentication/registration
* Static Markdown/HTML page content
* Sponsors
* Navigation
* File upload

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

- [Jest](https://jestjs.io/docs/en/getting-started)
- [create-react-app](https://github.com/facebook/create-react-app)

## Licensing

"The code in this project is licensed under [MIT license.](/LICENSE)"