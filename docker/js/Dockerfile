FROM centos
COPY start /
RUN yum update -y; yum install -y epel-release; curl --silent --location https://rpm.nodesource.com/setup_5.x | bash -; yum install -y nodejs; yum clean all
