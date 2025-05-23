module "wrapper" {
  source = "../../modules/carbon-relay-ng"

  for_each = var.items

  auto_computed_egress_rules                               = try(each.value.auto_computed_egress_rules, var.defaults.auto_computed_egress_rules, [])
  auto_computed_egress_with_self                           = try(each.value.auto_computed_egress_with_self, var.defaults.auto_computed_egress_with_self, [])
  auto_computed_ingress_rules                              = try(each.value.auto_computed_ingress_rules, var.defaults.auto_computed_ingress_rules, [])
  auto_computed_ingress_with_self                          = try(each.value.auto_computed_ingress_with_self, var.defaults.auto_computed_ingress_with_self, [])
  auto_egress_rules                                        = try(each.value.auto_egress_rules, var.defaults.auto_egress_rules, ["all-all"])
  auto_egress_with_self                                    = try(each.value.auto_egress_with_self, var.defaults.auto_egress_with_self, [])
  auto_ingress_rules                                       = try(each.value.auto_ingress_rules, var.defaults.auto_ingress_rules, ["carbon-line-in-tcp", "carbon-line-in-udp", "carbon-pickle-tcp", "carbon-pickle-udp", "carbon-gui-udp"])
  auto_ingress_with_self                                   = try(each.value.auto_ingress_with_self, var.defaults.auto_ingress_with_self, [{ "rule" = "all-all" }])
  auto_number_of_computed_egress_rules                     = try(each.value.auto_number_of_computed_egress_rules, var.defaults.auto_number_of_computed_egress_rules, 0)
  auto_number_of_computed_egress_with_self                 = try(each.value.auto_number_of_computed_egress_with_self, var.defaults.auto_number_of_computed_egress_with_self, 0)
  auto_number_of_computed_ingress_rules                    = try(each.value.auto_number_of_computed_ingress_rules, var.defaults.auto_number_of_computed_ingress_rules, 0)
  auto_number_of_computed_ingress_with_self                = try(each.value.auto_number_of_computed_ingress_with_self, var.defaults.auto_number_of_computed_ingress_with_self, 0)
  computed_egress_cidr_blocks                              = try(each.value.computed_egress_cidr_blocks, var.defaults.computed_egress_cidr_blocks, ["0.0.0.0/0"])
  computed_egress_ipv6_cidr_blocks                         = try(each.value.computed_egress_ipv6_cidr_blocks, var.defaults.computed_egress_ipv6_cidr_blocks, ["::/0"])
  computed_egress_prefix_list_ids                          = try(each.value.computed_egress_prefix_list_ids, var.defaults.computed_egress_prefix_list_ids, [])
  computed_egress_rules                                    = try(each.value.computed_egress_rules, var.defaults.computed_egress_rules, [])
  computed_egress_with_cidr_blocks                         = try(each.value.computed_egress_with_cidr_blocks, var.defaults.computed_egress_with_cidr_blocks, [])
  computed_egress_with_ipv6_cidr_blocks                    = try(each.value.computed_egress_with_ipv6_cidr_blocks, var.defaults.computed_egress_with_ipv6_cidr_blocks, [])
  computed_egress_with_prefix_list_ids                     = try(each.value.computed_egress_with_prefix_list_ids, var.defaults.computed_egress_with_prefix_list_ids, [])
  computed_egress_with_self                                = try(each.value.computed_egress_with_self, var.defaults.computed_egress_with_self, [])
  computed_egress_with_source_security_group_id            = try(each.value.computed_egress_with_source_security_group_id, var.defaults.computed_egress_with_source_security_group_id, [])
  computed_ingress_cidr_blocks                             = try(each.value.computed_ingress_cidr_blocks, var.defaults.computed_ingress_cidr_blocks, [])
  computed_ingress_ipv6_cidr_blocks                        = try(each.value.computed_ingress_ipv6_cidr_blocks, var.defaults.computed_ingress_ipv6_cidr_blocks, [])
  computed_ingress_prefix_list_ids                         = try(each.value.computed_ingress_prefix_list_ids, var.defaults.computed_ingress_prefix_list_ids, [])
  computed_ingress_rules                                   = try(each.value.computed_ingress_rules, var.defaults.computed_ingress_rules, [])
  computed_ingress_with_cidr_blocks                        = try(each.value.computed_ingress_with_cidr_blocks, var.defaults.computed_ingress_with_cidr_blocks, [])
  computed_ingress_with_ipv6_cidr_blocks                   = try(each.value.computed_ingress_with_ipv6_cidr_blocks, var.defaults.computed_ingress_with_ipv6_cidr_blocks, [])
  computed_ingress_with_prefix_list_ids                    = try(each.value.computed_ingress_with_prefix_list_ids, var.defaults.computed_ingress_with_prefix_list_ids, [])
  computed_ingress_with_self                               = try(each.value.computed_ingress_with_self, var.defaults.computed_ingress_with_self, [])
  computed_ingress_with_source_security_group_id           = try(each.value.computed_ingress_with_source_security_group_id, var.defaults.computed_ingress_with_source_security_group_id, [])
  create                                                   = try(each.value.create, var.defaults.create, true)
  description                                              = try(each.value.description, var.defaults.description, "Security Group managed by Terraform")
  egress_cidr_blocks                                       = try(each.value.egress_cidr_blocks, var.defaults.egress_cidr_blocks, ["0.0.0.0/0"])
  egress_ipv6_cidr_blocks                                  = try(each.value.egress_ipv6_cidr_blocks, var.defaults.egress_ipv6_cidr_blocks, ["::/0"])
  egress_prefix_list_ids                                   = try(each.value.egress_prefix_list_ids, var.defaults.egress_prefix_list_ids, [])
  egress_rules                                             = try(each.value.egress_rules, var.defaults.egress_rules, [])
  egress_with_cidr_blocks                                  = try(each.value.egress_with_cidr_blocks, var.defaults.egress_with_cidr_blocks, [])
  egress_with_ipv6_cidr_blocks                             = try(each.value.egress_with_ipv6_cidr_blocks, var.defaults.egress_with_ipv6_cidr_blocks, [])
  egress_with_prefix_list_ids                              = try(each.value.egress_with_prefix_list_ids, var.defaults.egress_with_prefix_list_ids, [])
  egress_with_self                                         = try(each.value.egress_with_self, var.defaults.egress_with_self, [])
  egress_with_source_security_group_id                     = try(each.value.egress_with_source_security_group_id, var.defaults.egress_with_source_security_group_id, [])
  ingress_cidr_blocks                                      = try(each.value.ingress_cidr_blocks, var.defaults.ingress_cidr_blocks, [])
  ingress_ipv6_cidr_blocks                                 = try(each.value.ingress_ipv6_cidr_blocks, var.defaults.ingress_ipv6_cidr_blocks, [])
  ingress_prefix_list_ids                                  = try(each.value.ingress_prefix_list_ids, var.defaults.ingress_prefix_list_ids, [])
  ingress_rules                                            = try(each.value.ingress_rules, var.defaults.ingress_rules, [])
  ingress_with_cidr_blocks                                 = try(each.value.ingress_with_cidr_blocks, var.defaults.ingress_with_cidr_blocks, [])
  ingress_with_ipv6_cidr_blocks                            = try(each.value.ingress_with_ipv6_cidr_blocks, var.defaults.ingress_with_ipv6_cidr_blocks, [])
  ingress_with_prefix_list_ids                             = try(each.value.ingress_with_prefix_list_ids, var.defaults.ingress_with_prefix_list_ids, [])
  ingress_with_self                                        = try(each.value.ingress_with_self, var.defaults.ingress_with_self, [])
  ingress_with_source_security_group_id                    = try(each.value.ingress_with_source_security_group_id, var.defaults.ingress_with_source_security_group_id, [])
  name                                                     = try(each.value.name, var.defaults.name)
  number_of_computed_egress_cidr_blocks                    = try(each.value.number_of_computed_egress_cidr_blocks, var.defaults.number_of_computed_egress_cidr_blocks, 0)
  number_of_computed_egress_ipv6_cidr_blocks               = try(each.value.number_of_computed_egress_ipv6_cidr_blocks, var.defaults.number_of_computed_egress_ipv6_cidr_blocks, 0)
  number_of_computed_egress_prefix_list_ids                = try(each.value.number_of_computed_egress_prefix_list_ids, var.defaults.number_of_computed_egress_prefix_list_ids, 0)
  number_of_computed_egress_rules                          = try(each.value.number_of_computed_egress_rules, var.defaults.number_of_computed_egress_rules, 0)
  number_of_computed_egress_with_cidr_blocks               = try(each.value.number_of_computed_egress_with_cidr_blocks, var.defaults.number_of_computed_egress_with_cidr_blocks, 0)
  number_of_computed_egress_with_ipv6_cidr_blocks          = try(each.value.number_of_computed_egress_with_ipv6_cidr_blocks, var.defaults.number_of_computed_egress_with_ipv6_cidr_blocks, 0)
  number_of_computed_egress_with_prefix_list_ids           = try(each.value.number_of_computed_egress_with_prefix_list_ids, var.defaults.number_of_computed_egress_with_prefix_list_ids, 0)
  number_of_computed_egress_with_self                      = try(each.value.number_of_computed_egress_with_self, var.defaults.number_of_computed_egress_with_self, 0)
  number_of_computed_egress_with_source_security_group_id  = try(each.value.number_of_computed_egress_with_source_security_group_id, var.defaults.number_of_computed_egress_with_source_security_group_id, 0)
  number_of_computed_ingress_cidr_blocks                   = try(each.value.number_of_computed_ingress_cidr_blocks, var.defaults.number_of_computed_ingress_cidr_blocks, 0)
  number_of_computed_ingress_ipv6_cidr_blocks              = try(each.value.number_of_computed_ingress_ipv6_cidr_blocks, var.defaults.number_of_computed_ingress_ipv6_cidr_blocks, 0)
  number_of_computed_ingress_prefix_list_ids               = try(each.value.number_of_computed_ingress_prefix_list_ids, var.defaults.number_of_computed_ingress_prefix_list_ids, 0)
  number_of_computed_ingress_rules                         = try(each.value.number_of_computed_ingress_rules, var.defaults.number_of_computed_ingress_rules, 0)
  number_of_computed_ingress_with_cidr_blocks              = try(each.value.number_of_computed_ingress_with_cidr_blocks, var.defaults.number_of_computed_ingress_with_cidr_blocks, 0)
  number_of_computed_ingress_with_ipv6_cidr_blocks         = try(each.value.number_of_computed_ingress_with_ipv6_cidr_blocks, var.defaults.number_of_computed_ingress_with_ipv6_cidr_blocks, 0)
  number_of_computed_ingress_with_prefix_list_ids          = try(each.value.number_of_computed_ingress_with_prefix_list_ids, var.defaults.number_of_computed_ingress_with_prefix_list_ids, 0)
  number_of_computed_ingress_with_self                     = try(each.value.number_of_computed_ingress_with_self, var.defaults.number_of_computed_ingress_with_self, 0)
  number_of_computed_ingress_with_source_security_group_id = try(each.value.number_of_computed_ingress_with_source_security_group_id, var.defaults.number_of_computed_ingress_with_source_security_group_id, 0)
  revoke_rules_on_delete                                   = try(each.value.revoke_rules_on_delete, var.defaults.revoke_rules_on_delete, false)
  tags                                                     = try(each.value.tags, var.defaults.tags, {})
  use_name_prefix                                          = try(each.value.use_name_prefix, var.defaults.use_name_prefix, true)
  vpc_id                                                   = try(each.value.vpc_id, var.defaults.vpc_id)
}
