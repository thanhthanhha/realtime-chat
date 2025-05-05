security_groups = {
  bastion = {
    name        = "bastion-sg"
    description = "Security group for bastion host - allows all traffic"
    type = "bastion_public"
    ingress_rules = [
      {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"  # -1 means all protocols
        description = "Allow all inbound traffic"
        cidr_blocks = "0.0.0.0/0"
      }
    ]
    egress_rules = [
      {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"  # -1 means all protocols
        description = "Allow all outbound traffic"
        cidr_blocks = "0.0.0.0/0"
      }
    ]
    # Additional tags specific to this security group
    tags = {
      Bastion = "true"
    }
  }
}