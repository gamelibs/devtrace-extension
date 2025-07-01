#!/bin/bash

# DevTrace Chrome Extension Build Script
# 版本: 2.3

echo "🚀 构建 DevTrace v2.3..."

BUILD_DIR="build"
PACKAGE_NAME="devtrace-v2.3"

# 清理构建目录
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/$PACKAGE_NAME"

echo "📁 复制文件..."
cp manifest.json "$BUILD_DIR/$PACKAGE_NAME/"
cp background.js "$BUILD_DIR/$PACKAGE_NAME/"
cp popup.html "$BUILD_DIR/$PACKAGE_NAME/"
cp popup.js "$BUILD_DIR/$PACKAGE_NAME/"
cp *.png "$BUILD_DIR/$PACKAGE_NAME/"
cp README.md "$BUILD_DIR/$PACKAGE_NAME/"

echo "📦 创建发布包..."
cd "$BUILD_DIR"
zip -r "${PACKAGE_NAME}.zip" "$PACKAGE_NAME/" > /dev/null

echo "✅ 构建完成!"
echo "� 发布包: $BUILD_DIR/${PACKAGE_NAME}.zip"
echo "📊 大小: $(du -h ${PACKAGE_NAME}.zip | cut -f1)"
