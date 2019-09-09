# Digit - Backend

Node backend for handling student organization Digit website. 

## IMPORTANT UPDATE

We have changed from Vagrant to Docker.

**TODO**: Update instructions

## Installing / Getting started

1. Install Docker

Instructions from [here](https://runnable.com/docker/getting-started/) and Google

2. Fork the project on [GitHub](https://help.github.com/en/articles/fork-a-repo)

3. Clone the project

```shell
git clone <your fork url>/digit-backend
cd digit-backend
```

4. Optional: Moving from Vagrant to Docker

Delete the Vagrant image from VirtualBox.\
Remove `.vagrant` folder on the project root
Remove `ubuntu-bionic_*.cloudimg-console.log` file
Remove both `applied_*.json` files from `/migrations` folder

5. Start developing

```
docker-compose up
```

Docker creates two containers, database and the node app and everything is controlled by docker so no need to install `npm` on host.



## Developing

Launch containers and start developing. `Pm2` will take care of reloading application whenever files are changed. Recommended not to use too frequent auto save function on editor. 

**Docker commands**

Open database\
`docker exec -it digit_db psql -U digit -h localhost digit_dev`
Show logs\
`docker container logs -f digit_db|digit_backend`
Run bash commands from host terminal against running container:\
`docker exec digit_backend ps`

Open a bash session on a running container:\
`docker container exec -it digit_backend /bin/sh`

### Testing

**NOTE!** Does not work on docker yet
Run `npm test`

> Running cli options requires two dashes between npm script and `Jest` command: `npm test -- <command>`
> See Jest's [documents](https://jestjs.io/docs/en/cli.html) page

Ensure `.env` file is present in the project root and contains atleast following keys. These defaults are set on `digit_dev.config.js`

```
PORT=3001
TEST_PORT=3031
```

#### Integration tests 

Integration tests are located in `/tests` folder on project root which tests API-endpoints. All tests that requires API must run `initializeApi` before all and `closeApi` after all tests. These functions intialized server with help of `supertest` library and are located on `testHelpers.js` file.

If tests fail and error output is needed, comment out `console.error(...)` on `./app/index.js` error handler (last function).  

#### Unit tests 

Write unit tests next to a testable component if possible.

### Deploying / Publishing

Production server has a bare git repo which allows making pushes directly to it using SSH. Currently managed only by Niemisami.

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

### 3. Make a new branch from master

    git checkout -b blazing-feature

Create a new branch from the `master` branch so you can always pull latest changes from upstream origin without interrupting your own feature development if new changes are available.

### 4. Updating your fork from original repo to keep up with their changes:

    git pull upstream master
      or
    git pull --rebase upstream master

 Please follow the steps on the previous block. If . Rebasing helps to keep the project history more readable and therefore more maintainable. Here's a good article about what it means and why to use it: [Git Fork Workflow Using Rebase](https://medium.com/@ruthmpardee/git-fork-workflow-using-rebase-587a144be470). 

### 5. Creating a feature

Example of how to create a new feature/fix

    # After the step 2. is performed
        git checkout -b blazing-feature
    # Make changes and commit with meaningful message
        git commit -m "Add new blazing feature"
        git checkout master
    # Update local master and rebase moves possible changes after the ones which are already on production
        git pull --rebase upstream master 
        git checkout blazing-feature
        git rebase master
    # Check that everything works and then perform merge or rebase
        git checkout master
        git merge blazing-feature
    # Check that your new feature works on master branch and make a pull request

**Take away:**
- Only update `feature` branch to keep project more maintainable for everyone
- Keep master always up to date with `upstream master`
- Keep commits small and on the topic
- Keep master always up to date with `upstream master`!!
- Rebase `feature` to your master branch

## Links

- [Jest](https://jestjs.io/docs/en/getting-started)
- [create-react-app](https://github.com/facebook/create-react-app)
- [Lessons From Building Node Apps in  Docker](https://jdlm.info/articles/2019/09/06/lessons-building-node-app-docker.html)

## Licensing

"The code in this project is licensed under [MIT license.](/LICENSE)"