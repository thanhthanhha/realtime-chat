region         = "ap-northeast-2"
environment    = "staging"
project_name   = "realchat"
cluster_version = "1.31"

# Cluster endpoint configuration
cluster_endpoint_private_access = true
cluster_endpoint_public_access  = true
cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]

# Node group configuration
node_instance_types  = ["m5.large"]
node_group_min_size  = 2
node_group_max_size  = 5
node_group_desired_size = 3
node_capacity_type   = "ON_DEMAND"
node_ami_type        = "AL2_x86_64"

# IAM additional policies for nodes
node_iam_additional_policies = {
  AmazonS3ReadOnlyAccess = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
  AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Roles to add to aws-auth ConfigMap
aws_auth_roles = [
  {
    rolearn  = "arn:aws:iam::ACCOUNT_ID:role/Admin" # Replace ACCOUNT_ID with your AWS account ID
    username = "admin"
    groups   = ["system:masters"]
  }
]

tags = {
  Owner       = "DevOps"
  Application = "RealChat"
  ManagedBy   = "Terraform"
}