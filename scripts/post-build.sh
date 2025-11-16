#!/bin/bash
# Post-build script for Cloudflare Pages
# Automatically deploys redirect rules after successful build

set -e

echo "🔧 Post-build: Checking for Cloudflare redirect rule deployment..."

# Check if we're in Cloudflare Pages environment
if [ -n "$CF_PAGES" ]; then
    echo "✅ Running in Cloudflare Pages environment"

    # Only deploy on production branch
    if [ "$CF_PAGES_BRANCH" = "main" ] || [ "$CF_PAGES_BRANCH" = "master" ]; then
        echo "🚀 Production branch detected: $CF_PAGES_BRANCH"

        # Check if credentials are available
        if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
            echo "⚠️  Warning: Cloudflare credentials not found in environment variables"
            echo "   Skipping redirect rule deployment"
            echo "   To enable automatic deployment, add these environment variables in Cloudflare Pages dashboard:"
            echo "   - CLOUDFLARE_ZONE_ID"
            echo "   - CLOUDFLARE_API_TOKEN"
            exit 0
        fi

        echo "🔑 Credentials found, deploying redirect rule..."

        # Deploy the redirect rule
        if ./cloudflare/deploy-redirect-rule.sh; then
            echo "✅ Redirect rule deployed successfully!"
        else
            echo "❌ Failed to deploy redirect rule (non-fatal, continuing...)"
            # Don't fail the build if redirect deployment fails
            exit 0
        fi
    else
        echo "⏭️  Skipping redirect deployment for preview branch: $CF_PAGES_BRANCH"
    fi
else
    echo "⏭️  Not in Cloudflare Pages environment, skipping redirect rule deployment"
fi

echo "✅ Post-build script complete"
