resource "aws_s3_bucket" "terraform_state" {
  bucket = "smarthostel-terraform-state-demo"

  tags = {
    Name        = "SmartHostel Terraform State"
    Environment = "Production"
  }
}

resource "aws_ecr_repository" "backend" {
  name = "smarthostel-backend"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name = "smarthostel-frontend"

  image_scanning_configuration {
    scan_on_push = true
  }
}
