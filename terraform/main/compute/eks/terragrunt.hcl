include {
  path = find_in_parent_folders()
}

terraform {
  source = "../eks"
}

dependency "vpc" {
  config_path = "../../network/vpc"
}

dependency "iam_policy" {
  config_path = "../../iam/policy/autoscaling_eks"
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.public_subnets
  eks_node_dependency_policies = dependency.vpc.outputs.policy_arns
}