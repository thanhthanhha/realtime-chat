terraform {
  source = "database/dynamodb"
  extra_arguments "conditional_vars" {
    commands = get_terraform_commands_that_need_vars()
    optional_var_files = [
      "${get_terragrunt_dir()}/database/dynamodb/terraform.tfvars"
    ]
  }
}

locals {
  environment_vars = read_terragrunt_config("env.hcl")
  
  environment = local.environment_vars.locals.environment
  aws_region = local.environment_vars.locals.aws_region
  project_name = local.environment_vars.locals.project_name
}


generate "s3_backend" {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
    contents  = <<EOF
terraform {
    backend "s3" {
        bucket = "realchat-terraform"
        key    = "${path_relative_to_include()}/terraform.tfstate"
        region = "ap-northeast-2"
        dynamodb_table = "realchat-terraform-locks"
        access_key     = "AKIATCKANWP6OMLSDJVO"
        secret_key     = "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"
    }
}
EOF
}

# remote_state {
#   backend = "s3"
#   generate = {
#     path      = "backend.tf"
#     if_exists = "overwrite_terragrunt"
#   }
#   config = {
#     encrypt        = true
#     bucket         = "realchat-app"
#     key            = "${path_relative_to_include()}/terraform.tfstate"
#     region         = "'ap-northeast-2"
#     encrypt        = true
#     dynamodb_table = "realchat-terraform-locks"
#     access_key     = "AKIATCKANWP6OMLSDJVO"
#     secret_key     = "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"
#   }
# }

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"
  
  default_tags {
    tags = {
      Environment = "${local.environment}"
      ManagedBy   = "Terragrunt"
      Terraform   = "true"
    }
  }
}
EOF
}

# Centralized inputs that can be used by all child terragrunt configurations
inputs = merge(
  {
    environment = local.environment
    aws_region  = local.aws_region
  }
)