# n8n Workflow Setup

## Import Workflow

1. Open your n8n instance
2. Go to **Workflows** > **Import from File**
3. Select `video-analysis-workflow.json`

## Configure Credentials

1. **OpenAI API**: Add your OpenAI API key in n8n credentials (Settings > Credentials > Add > OpenAI API)
2. Update both OpenAI nodes to use your credential

## Configure Environment Variables

Set these in your n8n instance (Settings > Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_CALLBACK_URL` | Your deployed app URL | `https://your-app.vercel.app` |
| `WEBHOOK_SECRET` | Shared secret for callback auth | Same value as `N8N_WEBHOOK_SECRET` in your app |

## Workflow Flow

```
Webhook (POST /video-analyze)
  ├─> OpenAI: Extract video tags, quality, hook strength
  │     └─> Parse JSON response
  │           └─> OpenAI: Predict KPI scores per platform
  │                 └─> Parse JSON response
  │                       └─> HTTP Callback to /api/webhook/results
  └─> Respond "accepted" immediately
```

## Activate

1. Toggle the workflow to **Active**
2. Copy the webhook URL (shown in the Webhook node)
3. Set it as `N8N_WEBHOOK_URL` in your app's `.env.local`

## Test

```bash
curl -X POST YOUR_N8N_WEBHOOK_URL/video-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-uuid",
    "videoUrl": "https://example.com/video.mp4",
    "platform": "tiktok",
    "targetAge": "18-24",
    "targetGender": "all",
    "targetTags": ["fitness", "gym"]
  }'
```
