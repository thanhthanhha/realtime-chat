provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {}

locals {
  name   = "${var.environment}-${var.project_name}-vpc"
  azs    = slice(data.aws_availability_zones.available.names, 0, 3)

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

################################################################################
# VPC Module
################################################################################

module "vpc" {
  source = "../../../../module/network/vpc"

  name = local.name
  cidr = var.vpc_config.cidr

  azs = local.azs
  
  # Create public subnets for bastion and EKS
  public_subnets = [
    for subnet in var.subnets : subnet.cidr if subnet.type == "public"
  ]

  # Create private subnets for EKS worker nodes
  private_subnets = [
    for subnet in var.subnets : subnet.cidr if subnet.type == "private"
  ]

  
  # Enable NAT gateway for private subnet internet access
  enable_nat_gateway = var.vpc_config.enable_nat_gateway
  single_nat_gateway = var.vpc_config.single_nat_gateway
  
  # DNS settings
  enable_dns_hostnames = var.vpc_config.enable_dns_hostnames
  enable_dns_support   = var.vpc_config.enable_dns_support

  # Public subnet tags - merge common public subnet tags with specific EKS tags where needed
  public_subnet_tags = {
    for key, value in var.subnet_tags : key => value
    if key == "public"
  }["public"]
  
  # Private subnet tags
  private_subnet_tags = {
    for key, value in var.subnet_tags : key => value
    if key == "private"
  }["private"]
  

  
  tags = local.tags
}

