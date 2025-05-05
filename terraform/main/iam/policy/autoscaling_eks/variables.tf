variable "policies" {
  description = "Map of policy configurations"
  type = object({
    name = string
    tags = map(string)
  })
  default = {
    name = "AutoScaling-Node"
    tags = {
      Role = "AutoScaling-NodeGroup"
    }
  }
}