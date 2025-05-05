module "iam_policy" {
    for_each = var.policies
    source = "../../../../../module/iam/modules/iam-policy"
    name_prefix = "eks-${each.key}-"
    path        = "/"

    policy = each.value.policy

    tags = each.value.tags
}