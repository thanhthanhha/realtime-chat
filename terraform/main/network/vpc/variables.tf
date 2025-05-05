


variable "vpc_config" {
  description = "VPC configuration settings"
  type = object({
    cidr               = string
    enable_nat_gateway = bool
    single_nat_gateway = bool
    enable_dns_hostnames = bool
    enable_dns_support = bool
  })
}

variable "subnets" {
  description = "List of subnet configurations"
  type = list(object({
    name         = string
    type         = string # "public", "private", or "database"
    cidr         = string
    az_index     = number # Index into the list of AZs
  }))
}

variable "subnet_tags" {
  description = "Tags for subnets by type"
  type = map(map(string))
}