output "policy_arns" {
  description = "ARNs of all IAM policies created"
  value = {
    for k, v in module.iam_policy : k => v.arn
  }
}