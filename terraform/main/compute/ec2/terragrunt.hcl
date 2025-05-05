include {
  path = find_in_parent_folders()
}

terraform {
  source = "../ec2"
}

dependency "ec2_keypair" {
  config_path = "../ec2-keypair"
}

dependency "vpc" {
  config_path = "../../network/vpc"
}

dependency "security_group" {
  config_path = "../security_group"
}

inputs = {
  ec2_keypair_name = dependency.ec2_keypair.outputs.key_pair_name
  vpc_id = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.public_subnets
  subnet_azs = dependency.vpc.outputs.public_subnet_azs
  security_group_id = dependency.security_group.outputs.security_group_ids
  security_group_type = dependency.security_group.outputs.security_group_type
}