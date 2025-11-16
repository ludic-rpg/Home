#!/bin/bash
# Deploy Cloudflare Redirect Rule via API
# This script creates or updates the French language redirect rule

set -e

# Check for required environment variables
if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: Required environment variables not set"
    echo "Please set:"
    echo "  CLOUDFLARE_ZONE_ID - Your zone ID (found in Cloudflare dashboard)"
    echo "  CLOUDFLARE_API_TOKEN - API token with 'Zone.Rulesets' edit permissions"
    exit 1
fi

ZONE_ID="$CLOUDFLARE_ZONE_ID"
API_TOKEN="$CLOUDFLARE_API_TOKEN"
RULE_FILE="cloudflare/redirect-rule.json"

echo "🚀 Deploying Cloudflare Redirect Rule..."
echo "Zone ID: $ZONE_ID"

# Get the zone's redirect ruleset ID
echo "📋 Getting existing rulesets..."
RULESET_RESPONSE=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")

# Extract redirect ruleset ID (phase: http_request_dynamic_redirect)
RULESET_ID=$(echo "$RULESET_RESPONSE" | jq -r '.result[] | select(.phase == "http_request_dynamic_redirect") | .id')

if [ -z "$RULESET_ID" ] || [ "$RULESET_ID" = "null" ]; then
    echo "❌ No redirect ruleset found. Creating new ruleset..."

    # Create new ruleset with the redirect rule
    CREATE_RESPONSE=$(curl -s -X POST \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Dynamic Redirects\",
            \"kind\": \"zone\",
            \"phase\": \"http_request_dynamic_redirect\",
            \"rules\": [$(cat $RULE_FILE)]
        }")

    SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')

    if [ "$SUCCESS" = "true" ]; then
        echo "✅ Redirect rule created successfully!"
        echo "$CREATE_RESPONSE" | jq '.result'
    else
        echo "❌ Failed to create redirect rule"
        echo "$CREATE_RESPONSE" | jq '.errors'
        exit 1
    fi
else
    echo "📝 Found existing ruleset: $RULESET_ID"
    echo "🔄 Updating ruleset with new redirect rule..."

    # Get existing rules
    EXISTING_RULES=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result.rules')

    # Check if our rule already exists (by name)
    RULE_EXISTS=$(echo "$EXISTING_RULES" | jq 'any(.name == "French Language Redirect")')

    if [ "$RULE_EXISTS" = "true" ]; then
        echo "♻️  Replacing existing French Language Redirect rule..."
        # Remove old rule and add new one
        NEW_RULES=$(echo "$EXISTING_RULES" | jq "map(select(.name != \"French Language Redirect\")) + [$(cat $RULE_FILE)]")
    else
        echo "➕ Adding new rule to existing ruleset..."
        NEW_RULES=$(echo "$EXISTING_RULES" | jq ". + [$(cat $RULE_FILE)]")
    fi

    # Update the ruleset
    UPDATE_RESPONSE=$(curl -s -X PUT \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"rules\": $NEW_RULES
        }")

    SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success')

    if [ "$SUCCESS" = "true" ]; then
        echo "✅ Redirect rule deployed successfully!"
        echo "$UPDATE_RESPONSE" | jq '.result.rules[] | select(.name == "French Language Redirect")'
    else
        echo "❌ Failed to deploy redirect rule"
        echo "$UPDATE_RESPONSE" | jq '.errors'
        exit 1
    fi
fi

echo ""
echo "🎉 Deployment complete!"
echo "Your French language redirect is now active on all Cloudflare edge locations."
