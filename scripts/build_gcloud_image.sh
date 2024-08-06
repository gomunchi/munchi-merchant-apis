#!/bin/bash
root_folder=$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)

cd $root_folder

docker build -t europe-north1-docker.pkg.dev/munchioy-backend/docker-containers/munchi-merchant-api -f Dockerfile.gcloud .