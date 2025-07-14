# AWS Textract Setup Guide

This guide will help you set up AWS Textract for document processing in the AI Immigration Agent.

## Why AWS Textract?

AWS Textract is particularly well-suited for immigration forms because it:
- **Excels at form extraction** - Can identify form fields and their values automatically
- **Handles complex tables** - Perfect for immigration forms with tabular data
- **Multi-page document support** - Better for complex multi-page forms
- **Handwriting recognition** - Good for handwritten forms
- **High accuracy** - Generally more accurate than other OCR services for structured documents

## Prerequisites

1. AWS account
2. AWS CLI installed (optional but recommended)
3. Appropriate permissions to create IAM users and policies

## Step 1: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** > **Create user**
3. Enter username: `ai-immigration-textract`
4. Select **Programmatic access**
5. Click **Next: Permissions**

## Step 2: Attach Permissions

### Option A: Attach Managed Policy (Recommended)
1. Click **Attach existing policies directly**
2. Search for and select `AmazonTextractFullAccess`
3. Click **Next: Tags** (optional)
4. Click **Next: Review**
5. Click **Create user**

### Option B: Create Custom Policy (More Secure)
1. Go to **Policies** > **Create policy**
2. Use JSON editor and paste:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "textract:DetectDocumentText",
                "textract:AnalyzeDocument",
                "textract:AnalyzeExpense",
                "textract:GetDocumentAnalysis",
                "textract:GetDocumentTextDetection"
            ],
            "Resource": "*"
        }
    ]
}
```
3. Name it `TextractAccessPolicy`
4. Attach this policy to your user

## Step 3: Create Access Keys

1. Click on your created user
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Select **Application running outside AWS**
5. Click **Next**
6. Add description: "AI Immigration Agent Textract Access"
7. Click **Create access key**
8. **IMPORTANT**: Download the CSV file or copy the keys immediately

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

### For Production/Deployment:
- Use AWS IAM roles instead of access keys when possible
- For Vercel: Add these as environment variables in your project settings
- For other platforms: Follow their AWS credential configuration

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Upload a document (PDF or image)
3. Click the "Process" button (play icon) on the document
4. Check the console for any errors

## Step 6: Monitor Usage

1. Go to [AWS Textract Console](https://console.aws.amazon.com/textract/)
2. Click on **Usage** to view metrics
3. Set up CloudWatch alarms for usage monitoring

## Cost Information

- **Free Tier**: 1,000 pages/month for first 3 months
- **Paid Tier**: 
  - Text detection: $1.50 per 1,000 pages
  - Form analysis: $2.50 per 1,000 pages
  - Table analysis: $2.50 per 1,000 pages

## Troubleshooting

### Common Issues:

1. **"Access Denied" error**
   - Ensure the IAM user has the correct permissions
   - Check that the access keys are correct
   - Verify the region is correct

2. **"Invalid credentials" error**
   - Verify the access key ID and secret access key
   - Check that the keys are not expired
   - Ensure the keys are for the correct AWS account

3. **"Quota exceeded" error**
   - Check your usage in AWS Console
   - Consider requesting a quota increase

4. **"Document too large" error**
   - Textract has a 5MB limit for synchronous operations
   - For larger documents, consider splitting them

### Debug Mode:

To see detailed logs, add this to your `.env.local`:
```bash
DEBUG=@aws-sdk/client-textract
```

## Security Best Practices

1. **Use least privilege principle**
   - Only grant necessary Textract permissions
   - Consider using temporary credentials

2. **Rotate access keys regularly**
   - Create new access keys periodically
   - Delete old unused keys

3. **Monitor usage**
   - Set up CloudWatch alarms
   - Monitor costs regularly

4. **Use IAM roles when possible**
   - For production deployments on AWS
   - More secure than access keys

## Performance Optimization

1. **Document preparation**
   - Ensure documents are clear and well-lit
   - Use high-resolution scans
   - Avoid heavily skewed or rotated documents

2. **Batch processing**
   - Process multiple documents in parallel
   - Use async processing for large volumes

3. **Caching**
   - Cache extracted data to avoid reprocessing
   - Store results in your database

## Next Steps

After setting up AWS Textract:

1. Run the database migration:
   ```sql
   -- Execute the SQL from supabase-document-processing.sql
   ```

2. Test document processing:
   - Upload a passport or visa document
   - Process it and verify extracted data
   - Check form field extraction accuracy

3. Test form auto-filling:
   - Go to the Forms page
   - Select a form template
   - Verify auto-filling works with extracted data

## Comparison with Google Cloud Vision

| Feature | AWS Textract | Google Cloud Vision |
|---------|-------------|-------------------|
| Form extraction | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| Table extraction | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| Text accuracy | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent |
| Multi-page support | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Very Good |
| Handwriting | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐ Very Good |
| Cost (forms) | $2.50/1K pages | $1.50/1K requests |
| Free tier | 1K pages (3 months) | 1K requests/month |

## Support

If you encounter issues:

1. Check the [AWS Textract documentation](https://docs.aws.amazon.com/textract/)
2. Review the [AWS CloudWatch logs](https://console.aws.amazon.com/cloudwatch/)
3. Check your application logs for detailed error messages
4. Use AWS Support if you have a support plan 