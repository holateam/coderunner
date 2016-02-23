FROM centos
COPY start /usr/bin
COPY startcompile /usr/bin
RUN yum update -y; yum install -y epel-release; curl --silent --location https://rpm.nodesource.com/setup_5.x | bash -; yum install -y nodejs; yum clean all
