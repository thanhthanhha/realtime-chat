provider "aws" {
  region = var.region
}

data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

locals {
  cluster_name = "${var.environment}-${var.project_name}-eks"
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

module "eks" {
  source  = "../../../../module/compute/eks"
  version = "~> 20.0"

  cluster_name    = local.cluster_name
  cluster_version = var.cluster_version

  # Network configuration
  vpc_id     = var.vpc_id
  subnet_ids = var.subnet_ids
  
  # Cluster endpoint access
  cluster_endpoint_private_access = var.cluster_endpoint_private_access
  cluster_endpoint_public_access  = var.cluster_endpoint_public_access
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  # Cluster addons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
    aws-load-balancer-controller = {
      most_recent = true
    }
    cluster-autoscaler = {
      most_recent = true
    }
  }

  # EKS Managed Node Group(s)
  eks_managed_node_groups = {
    default = {
      name = "${local.cluster_name}-default-ng"
      
      instance_types = var.node_instance_types
      
      min_size     = var.node_group_min_size
      max_size     = var.node_group_max_size
      desired_size = var.node_group_desired_size
      
      capacity_type  = var.node_capacity_type
      
      # Ensure proper bootstrap
      update_config = {
        max_unavailable_percentage = 33
      }
      
      # Use latest EKS optimized AMI
      ami_type = var.node_ami_type
      
      # Node IAM role gets created automatically with necessary policies
            iam_role_additional_policies = merge(
              var.node_iam_additional_policies,
              var.eks_node_dependency_policies
            )
      
      # Add required tags for cluster autoscaler
      tags = {
        "k8s.io/cluster-autoscaler/enabled" = "true"
        "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
      }
    }
  }

  # aws-auth configmap
  manage_aws_auth_configmap = true
  aws_auth_roles = var.aws_auth_roles

  tags = merge(local.tags, var.tags)
}