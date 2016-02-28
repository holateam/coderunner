#!/usr/bin/env bash
echo '---------- [SHPP] CodeRunner Service -----------';
echo '------ centOS/7 & Ubuntu bootstrap script ------';

info () {
  echo "---|  INFO: $1"
}

error () {
  echo "---| ERROR: $1"
}

info 'Resolving system package manager'
INSTALLER=''
if ! [[ $(type yum) = '' ]]
then
  info 'yum package manager was found'
  INSTALLER='yum'
fi
if ! [[ $(type apt-get) = '' ]]
then
  info 'apt-get package manager was found'
  INSTALLER='apt-get'
fi
if [[ ${INSTALLER} = '' ]]
then
  error 'No supported package manager found. Aborting.'
  exit
fi

info 'Resolving if the system is vagrant-provided'
if [[ $(echo ~vagrant) = '~vagrant' ]]
then
  info "This system is a non-Vagrant. Using current user as default ($USER)"
  USER_HOME=$HOME
  PROJECT_SYNC_DIR=$(pwd)
else
  info 'This system is provided with Vagrant. Using user `vagrant` as default'
  USER_HOME=$(echo ~vagrant)
  PROJECT_SYNC_DIR=${USER_HOME}/sync
fi

info 'Updating grub command line to enable memory swapping'
[[ -r /etc/default/grub ]] && info 'writing changes to file /etc/default/grub' || echo error '/etc/default/grub is unavailable'
sudo bash -c 'echo "GRUB_CMDLINE_LINUX=\"cgroup_enable=memory swapaccount=1\"" >> /etc/default/grub'

info 'Updating repositories data'
sudo ${INSTALLER} -y update

info 'Checking package: docker'
if [[ $(type docker) = '' ]]
then
	info 'Can not find docker, installing'
	info "${INSTALLER} -y install docker"
	bash -c "sudo ${INSTALLER} -y install docker"
else
	info 'docker is already installed'
fi

info 'Checking package: curl'
if [[ $(type curl) = '' ]]
then
	info 'Can not find curl, installing'
	sudo ${INSTALLER} -y install curl
else
	info 'curl is already installed'
fi

info 'Checking package: git'
if [[ $(type git) = '' ]]
then
	info 'Can not find git, installing'
	sudo ${INSTALLER} -y install git
else
	info 'git is already installed'
fi

info 'Checking package: node.js'
if [[ $(type node) = '' ]]
then
	info 'Can not find node.js, installing'
	curl --silent --location https://rpm.nodesource.com/setup_5.x | sudo bash -
	sudo ${INSTALLER} -y install nodejs
else
	info 'node.js is already installed'
fi

if ! [[ -r ${PROJECT_SYNC_DIR}/node/server.js ]]
then
  error "Troubles while synchronizing repository, file ${PROJECT_SYNC_DIR}/node/server.js is not available."
  exit 1
fi

info 'Project was synchronized successfully'

info 'Starting server deployment'
cd ${PROJECT_SYNC_DIR}

info 'Adding non sudo docker usage'
sudo groupadd docker
sudo gpasswd -a vagrant docker
newgrp docker
sudo service docker restart

info 'Moving project to static directory'
PROJECT_HOME=${USER_HOME}/coderunner
mkdir ${PROJECT_HOME}
cp -avr ${PROJECT_SYNC_DIR}/* ${PROJECT_HOME}
if ! [[ -r ${PROJECT_HOME}/coderunner/node/server.js ]]
then
  error "Troubles while copying project locally, file ${PROJECT_HOME}/node/server.js is not available. Aborting."
  exit 1
fi

info 'Looking for available docker language compilers'
for FILE in `find ${PROJECT_HOME}/docker/* -type d`
do
  lang=$(basename ${FILE})
  info "Found language: $lang. Creating docker container"
  cd ${FILE}
  sudo docker build -t ${lang}_img .
done

info 'Installing node.js npm modules and dependencies'
cd ${PROJECT_HOME}/node
npm install

info 'Starting CodeRunner service'
npm install -g forever forever-service
forever-service install -s ${PROJECT_HOME}/node/server.js --start

info 'Service deployment finished'
