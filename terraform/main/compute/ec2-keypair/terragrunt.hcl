include {
  path = find_in_parent_folders()
}

terraform {
  source = "../ec2-keypair"
}

inputs = {
}