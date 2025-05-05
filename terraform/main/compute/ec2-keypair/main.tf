module "key_pair" {
  for_each = var.key_pairs
  source = "../../"

  key_name           = each.key
  create_private_key = true

  tags = each.value.tags
}

resource "local_file" "private_key_file" {
  for_each = var.key_pairs
  
  content         = module.key_pair[each.key].private_key_pem
  filename        = "${path.module}/${each.key}.pem"
  file_permission = "0400"  # Read-only permission for owner
}