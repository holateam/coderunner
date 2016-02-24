
Vagrant.configure(2) do |config|

  config.vm.box = "centos/7"
  config.vm.network :forwarded_port, host: 8081, guest: 5555
  config.vm.provision :shell, path: "coderunner.install.sh"

end
