#!/bin/sh
# init-data.sh - Initialize data files if they don't exist

DATA_DIR="/data"
SOURCE_DIR="/app/public/data"

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Initialize each JSON file if it doesn't exist
init_file() {
  local file="$1"
  local content="$2"
  
  if [ ! -f "$DATA_DIR/$file" ]; then
    echo "Initializing $file..."
    # Try to copy from source first (if exists in image)
    if [ -f "$SOURCE_DIR/$file" ]; then
      echo "Copying from source: $SOURCE_DIR/$file"
      cp "$SOURCE_DIR/$file" "$DATA_DIR/$file"
    else
      echo "Creating new: $DATA_DIR/$file"
      echo "$content" > "$DATA_DIR/$file"
    fi
  else
    echo "$file already exists, skipping..."
  fi
}

# Initialize all data files with default content
init_file "users.json" '[]'
init_file "ipa.json" '[]'
init_file "dylib.json" '[]'
init_file "conf.json" '[]'
init_file "cert.json" '[]'
init_file "mod.json" '[]'
init_file "keys.json" '[]'
init_file "vpn_data.json" '[]'
init_file "sign.json" '[]'

echo "Data initialization complete!"
