
variable "vpc_id" {
  description = "ID of the VPC where security groups will be created"
  type        = string
}

variable "bastion_allowed_ips" {
  description = "List of CIDR blocks allowed to connect to bastion host"
  type        = string
  default     = "0.0.0.0/0"  # WARNING: This allows access from anywhere, should be restricted in production
}

variable "security_groups" {
  description = "Map of security groups to create"
  type = map(object({
    name        = string
    description = string
    type = string
    ingress_rules = list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      description = string
      cidr_blocks = string
    }))
    egress_rules = list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      description = string
      cidr_blocks = string
    }))
  }))
  default = {}
}