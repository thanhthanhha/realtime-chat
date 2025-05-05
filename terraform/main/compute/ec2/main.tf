data "aws_availability_zones" "available" {}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  # Get the subnet ID at index 1
  specific_subnet_id = element(var.subnet_ids.public[*].id, 0)
  
  # Then use that ID to look up the AZ
  specific_subnet_az = lookup(local.public_subnet_azs_map, local.specific_subnet_id)
}


################################################################################
# EC2 Module
################################################################################

module "ec2_complete" {
  for_each = var.ec2_instances
  source = "../../../../module/compute/ec2"

  name = each.key

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t2.small" # used to set core count below
  availability_zone      = local.specific_subnet_az
  subnet_id              = local.specific_subnet_id
  vpc_security_group_ids = [
    for key, value in var.security_group_type : 
    key
    if value == each.value.security_group_type
  ]
  create_eip             = true
  disable_api_stop       = false

  create_iam_instance_profile = true
  iam_role_description        = "IAM role for EC2 instance"
  iam_role_policies = {
    AdministratorAccess = "arn:aws:iam::aws:policy/AdministratorAccess"
  }

  # only one of these can be enabled at a time
  hibernation = true
  # enclave_options_enabled = true

  user_data_base64            = base64encode(each.value.user_data)
  user_data_replace_on_change = true

  enable_volume_tags = false
  root_block_device = [
    {
      encrypted   = true
      volume_type = "gp3"
      throughput  = 200
      volume_size = 50
      tags = {
        Name = "my-root-block"
      }
    },
  ]

  ebs_block_device = [
    {
      device_name = "/dev/sdf"
      volume_type = "gp3"
      volume_size = 5
      throughput  = 200
      encrypted   = true
      kms_key_id  = aws_kms_key.this.arn
      tags = {
        MountPoint = "/mnt/data"
      }
    }
  ]

  tags = each.value.tags
}
