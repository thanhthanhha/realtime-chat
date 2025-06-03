#!/bin/bash
# Set variables
CRDS_FOLDER="crds"  # Folder containing CRD definitions
NAMESPACE="default"  # Namespace where your app will be deployed

# Function to create namespace if it doesn't exist
create_ns() {
    local NAMESPACE=$1
    if kubectl get namespace "$NAMESPACE" &>/dev/null; then
        echo "Namespace $NAMESPACE already exists"
    else
        echo "Creating namespace $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
        
        # Verify creation was successful
        if [ $? -eq 0 ]; then
            echo "Namespace $NAMESPACE created successfully"
        else
            echo "Failed to create namespace $NAMESPACE"
            exit 1
        fi
    fi
}

# Function to install CRDs from a directory
install_crds() {
    local crds_path=$1
    local crds_name=$(basename "$crds_path")
    
    echo "Installing CRDs from $crds_path..."
    
    # Apply all YAML files in the directory with server-side apply
    # This helps with larger CRDs and avoids client-side validation issues
    kubectl apply --server-side -f ${crds_path}/*.yaml
    
    if [ $? -eq 0 ]; then
        echo "CRDs from $crds_name installed successfully"
    else
        echo "Failed to install CRDs from $crds_name"
        exit 1
    fi
    
    echo "----------------------------------------"
}

# Check if CRDs folder exists
if [ ! -d "$CRDS_FOLDER" ]; then
    echo "Error: CRDs folder '$CRDS_FOLDER' not found!"
    exit 1
fi

# Create the namespace where your application will run
create_ns "$NAMESPACE"

# Find all subdirectories in the CRDs folder
echo "Searching for CRD definitions in $CRDS_FOLDER..."
echo "----------------------------------------"

# Apply CRDs from the main folder
if ls "$CRDS_FOLDER"/*.yaml &>/dev/null; then
    install_crds "$CRDS_FOLDER"
fi

# Apply CRDs from subdirectories if they exist
find "$CRDS_FOLDER" -mindepth 1 -maxdepth 1 -type d | while read -r crds_dir; do
    if ls "$crds_dir"/*.yaml &>/dev/null; then
        install_crds "$crds_dir"
    fi
done

echo "All CRDs have been processed."
echo "----------------------------------------"
echo "Verifying installed CRDs:"
kubectl get crds | grep -i "$(basename $(pwd))" || echo "No CRDs found matching current project name"