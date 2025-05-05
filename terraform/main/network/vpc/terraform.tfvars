

# VPC configuration
common_config = {
  cidr               = "10.0.0.0/16"
  enable_nat_gateway = true
  single_nat_gateway = true
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Common tags for subnet types
subnet_tags = {
  public = {
    "Type" = "Public"
    "kubernetes.io/role/elb" = "1"
  }
  
  private = {
    "Type" = "Private"
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/eks-cluster" = "shared"
  }
  
}

# Subnet configurations
subnets = [
  # Public subnet for bastion host
  {
    name     = "bastion"
    type     = "public"
    cidr     = "10.0.0.0/24"
    az_index = 0
  },
  
  # Public subnets for EKS in different AZs
  {
    name     = "eks-public-1"
    type     = "public"
    cidr     = "10.0.1.0/24"
    az_index = 0
  },
  {
    name     = "eks-public-2"
    type     = "public"
    cidr     = "10.0.2.0/24"
    az_index = 1
  },
  {
    name     = "eks-public-3"
    type     = "public"
    cidr     = "10.0.3.0/24"
    az_index = 2
  },
  
  # Private subnets for EKS worker nodes
  {
    name     = "eks-private-1"
    type     = "private"
    cidr     = "10.0.10.0/24"
    az_index = 0
  },
  {
    name     = "eks-private-2"
    type     = "private"
    cidr     = "10.0.11.0/24"
    az_index = 1
  },
  {
    name     = "eks-private-3"
    type     = "private"
    cidr     = "10.0.12.0/24"
    az_index = 2
  }
  
]
