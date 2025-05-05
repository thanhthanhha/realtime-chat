include {
  path = find_in_parent_folders()
}

terraform {
  source = "../autoscaling_eks"
}

inputs = {
}