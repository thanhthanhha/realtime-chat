variable "create_launch_template" {
  description = "Whether to create a launch template or not"
  type        = bool
  default     = true
}

variable "name" {
  description = "Name of the launch template"
  type        = string
  default     = null
}

variable "name_prefix" {
  description = "Name prefix of the launch template"
  type        = string
  default     = null
}

variable "description" {
  description = "Description of the launch template"
  type        = string
  default     = null
}

variable "ebs_optimized" {
  description = "If true, the launched EC2 instance will be EBS-optimized"
  type        = bool
  default     = null
}

variable "image_id" {
  description = "The AMI from which to launch the instance"
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "The type of the instance"
  type        = string
  default     = null
}

variable "key_name" {
  description = "The key name that should be used for the instance"
  type        = string
  default     = null
}

variable "user_data" {
  description = "The Base64-encoded user data to provide when launching the instance"
  type        = string
  default     = null
}

variable "user_data_base64" {
  description = "Determines whether user_data is already base64 encoded"
  type        = bool
  default     = false
}

variable "vpc_security_group_ids" {
  description = "A list of security group IDs to associate with"
  type        = list(string)
  default     = null
}

variable "kernel_id" {
  description = "The kernel ID"
  type        = string
  default     = null
}

variable "ram_disk_id" {
  description = "The ID of the RAM disk"
  type        = string
  default     = null
}

variable "block_device_mappings" {
  description = "Specify volumes to attach to the instance besides the volumes specified by the AMI"
  type        = list(any)
  default     = []
}

variable "capacity_reservation_specification" {
  description = "Targeting for EC2 capacity reservations"
  type        = any
  default     = {}
}

variable "cpu_options" {
  description = "The CPU options for the instance"
  type        = map(string)
  default     = {}
}

variable "credit_specification" {
  description = "Customize the credit specification of the instance"
  type        = map(string)
  default     = {}
}

variable "disable_api_stop" {
  description = "If true, enables EC2 Instance Stop Protection"
  type        = bool
  default     = null
}

variable "disable_api_termination" {
  description = "If true, enables EC2 Instance Termination Protection"
  type        = bool
  default     = null
}

variable "enclave_options" {
  description = "Enable Nitro Enclaves on launched instances"
  type        = map(string)
  default     = {}
}

variable "hibernation_options" {
  description = "The hibernation options for the instance"
  type        = map(string)
  default     = {}
}

variable "iam_instance_profile" {
  description = "The IAM Instance Profile to launch the instance with"
  type        = map(string)
  default     = {}
}

variable "instance_initiated_shutdown_behavior" {
  description = "Shutdown behavior for the instance. Amazon defaults this to stop for EBS-backed instances and terminate for instance-store instances. Cannot be set on instance-store instances"
  type        = string
  default     = null
}

variable "instance_market_options" {
  description = "The market (purchasing) option for the instance"
  type        = any
  default     = {}
}

variable "license_specifications" {
  description = "A list of license specifications to associate with"
  type        = list(map(string))
  default     = []
}

variable "metadata_options" {
  description = "Customize the metadata options for the instance"
  type        = map(string)
  default     = {}
}

variable "monitoring" {
  description = "The monitoring option for the instance"
  type        = map(string)
  default     = {}
}

variable "network_interfaces" {
  description = "Customize network interfaces to be attached at instance boot time"
  type        = list(any)
  default     = []
}

variable "placement" {
  description = "The placement of the instance"
  type        = map(string)
  default     = {}
}

variable "private_dns_name_options" {
  description = "The options for the instance hostname"
  type        = map(string)
  default     = {}
}

variable "tag_specifications" {
  description = "The tags to apply to resources created by the launch template during instance launch"
  type        = list(any)
  default     = []
}

variable "tags" {
  description = "A map of tags to assign to the launch template"
  type        = map(string)
  default     = {}
}

variable "update_default_version" {
  description = "Whether to update the default version of the launch template"
  type        = bool
  default     = false
}