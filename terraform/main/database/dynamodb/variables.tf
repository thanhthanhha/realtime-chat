# main/database/dynamodb/variables.tf

variable "common_config" {
  description = "Common configuration for all DynamoDB tables"
  type = object({
    table_class                 = string
    deletion_protection_enabled = bool
    stream_enabled             = bool
    stream_view_type           = string
    billing_mode               = string
  })
}

variable "tables" {
  description = "Map of DynamoDB table configurations"
  type = map(object({
    name     = string
    hash_key = string
    attributes = list(object({
      name = string
      type = string
    }))
    global_secondary_indexes = optional(list(object({
      name            = string
      hash_key        = string
      projection_type = string
    })))
    tags = map(string)
  }))
}