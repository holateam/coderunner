FROM centos
COPY start /usr/bin/
COPY startcompile /usr/bin/
# yum install -y java-devel
RUN yum update -y; yum install -y java-1.7.0-openjdk-devel; yum clean all
