#!/bin/bash

# DevTrace Extension Build Script v2.4
# This script creates a clean production build of the DevTrace extension

# Set variables
VERSION="2.4"
BUILD_DIR="devtrace-v${VERSION}"
ARCHIVE_NAME="devtrace-v${VERSION}.zip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}DevTrace Extension Build Script v${VERSION}${NC}"
echo "============================================="

# Check if required files exist
echo -e "${YELLOW}Checking required files...${NC}"
required_files=("manifest.json" "background.js" "popup.html" "popup.js" "icon16.png" "icon48.png" "icon128.png" "default_icon16.png" "default_icon48.png" "default_icon128.png")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Required file '$file' not found!${NC}"
        exit 1
    fi
done

echo -e "${GREEN}All required files found.${NC}"

# Create build directory
echo -e "${YELLOW}Creating build directory...${NC}"
if [ -d "$BUILD_DIR" ]; then
    echo "Removing existing build directory..."
    rm -rf "$BUILD_DIR"
fi

mkdir "$BUILD_DIR"

# Copy files to build directory
echo -e "${YELLOW}Copying files to build directory...${NC}"
cp manifest.json "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp popup.js "$BUILD_DIR/"
cp *.png "$BUILD_DIR/"

# Copy README if it exists
if [ -f "README.md" ]; then
    cp README.md "$BUILD_DIR/"
fi

# Verify manifest version
echo -e "${YELLOW}Verifying manifest version...${NC}"
manifest_version=$(grep '"version"' "$BUILD_DIR/manifest.json" | sed 's/.*"version": *"\([^"]*\)".*/\1/')
if [ "$manifest_version" != "$VERSION" ]; then
    echo -e "${RED}Warning: Manifest version ($manifest_version) doesn't match build version ($VERSION)${NC}"
fi

# Create archive
echo -e "${YELLOW}Creating archive...${NC}"
if [ -f "$ARCHIVE_NAME" ]; then
    echo "Removing existing archive..."
    rm "$ARCHIVE_NAME"
fi

cd "$BUILD_DIR"
zip -r "../$ARCHIVE_NAME" .
cd ..

# Get file sizes
build_size=$(du -sh "$BUILD_DIR" | cut -f1)
archive_size=$(du -sh "$ARCHIVE_NAME" | cut -f1)

# Show summary
echo ""
echo -e "${GREEN}Build completed successfully!${NC}"
echo "============================================="
echo -e "Version:        ${BLUE}$VERSION${NC}"
echo -e "Build directory: ${BLUE}$BUILD_DIR${NC} ($build_size)"
echo -e "Archive:        ${BLUE}$ARCHIVE_NAME${NC} ($archive_size)"
echo ""
echo -e "${YELLOW}Files included:${NC}"
ls -la "$BUILD_DIR"

echo ""
echo -e "${GREEN}Ready for distribution!${NC}"
echo -e "Upload ${BLUE}$ARCHIVE_NAME${NC} to Chrome Web Store or load ${BLUE}$BUILD_DIR${NC} as unpacked extension."
