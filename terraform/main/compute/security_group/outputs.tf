output "security_group_ids" {
  description = "Map of security group IDs"
  value = {
    for sg_key, sg in module.security_groups : sg_key => sg.security_group_id
  }
}


output "security_group_type" {
  description = "Map of security group IDs"
  value = {
    for sg_key, sg in module.security_groups : sg_key => sg.type
  }
}