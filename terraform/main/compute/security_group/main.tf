module "security_groups" {
  for_each    = var.security_groups
  source      = "../../../../module/network/security-group"
  
  name        = each.value.name
  description = each.value.description
  vpc_id      = var.vpc_id
  
  ingress_with_cidr_blocks = [
    for rule in each.value.ingress_rules : {
      from_port   = rule.from_port
      to_port     = rule.to_port
      protocol    = rule.protocol
      description = rule.description
      cidr_blocks = rule.cidr_blocks
    }
  ]
  
  egress_with_cidr_blocks = [
    for rule in each.value.egress_rules : {
      from_port   = rule.from_port
      to_port     = rule.to_port
      protocol    = rule.protocol
      description = rule.description
      cidr_blocks = rule.cidr_blocks
    }
  ]
  
  tags = {
    Name        = each.value.name
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}
