include {
  path = find_in_parent_folders()
}

terraform {
  source = "../security_group"
}

dependency "vpc" {
  config_path = "../../network/vpc"
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.public_subnets
}