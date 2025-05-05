locals {
  common_config = var.common_config
}

module "dynamodb_tables" {
  for_each = var.tables
  source   = "../../../../module/database/dynamodb"

  name                        = each.value.name
  hash_key                    = each.value.hash_key
  table_class                 = local.common_config.table_class
  deletion_protection_enabled = local.common_config.deletion_protection_enabled
  stream_enabled             = local.common_config.stream_enabled
  stream_view_type           = local.common_config.stream_view_type
  billing_mode               = local.common_config.billing_mode
  attributes                 = each.value.attributes
  global_secondary_indexes   = each.value.global_secondary_indexes

  tags = merge(
    each.value.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terragrunt"
      Terraform   = "true"
    }
  )
}