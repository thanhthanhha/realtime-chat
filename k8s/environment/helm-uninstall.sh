#!/bin/bash

# Set variables
HELM_FOLDER="helm"  # Change this if your helm folder has a different name
APP_NAME="realchat"
NAMESPACE="default"  # Change this if you want to use a different namespace

# Function to install a helm chart
install_helm_chart() {
    local chart_path=$1
    local chart_name=$(basename "$chart_path")
    local NAMESPACE=$chart_name
    
    echo "Uninstalling $chart_name from $chart_path..."
    
    # Create a release name by combining app name and chart name
    # Convert to lowercase and replace underscores/spaces with hyphens
    release_name="${APP_NAME}-${chart_name}"
    release_name=$(echo "$release_name" | tr '[:upper:]' '[:lower:]' | tr '_' '-' | tr ' ' '-')
    
    # Check if the chart already exists
    if helm list | grep $release_name; then
        echo "Uninstalling chart $release_name..."
        helm uninstall "$release_name" "$chart_path" -n "$NAMESPACE"
    fi
    
    echo "----------------------------------------"
}

# Check if helm folder exists
if [ ! -d "$HELM_FOLDER" ]; then
    echo "Error: Helm folder '$HELM_FOLDER' not found!"
    exit 1
fi

# Find all subdirectories in the helm folder that contain Chart.yaml
echo "Searching for Helm charts in $HELM_FOLDER..."
echo "----------------------------------------"

find "$HELM_FOLDER" -maxdepth 1 -type d -exec test -e "{}/Chart.yaml" \; -print | while read -r chart_dir; do
    install_helm_chart "$chart_dir"
done

# List all installed releases
echo "All Helm charts have been processed."
echo "----------------------------------------"
echo "Currently installed releases:"
helm list -n "$NAMESPACE" | grep "$APP_NAME"