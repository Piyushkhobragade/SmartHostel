output "backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "terraform_state_bucket" {
  value = aws_s3_bucket.terraform_state.bucket
}
