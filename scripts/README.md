# Sitemap Generation

This directory contains scripts for generating sitemaps for the RateCreator
website.

## Sitemap Generation Script

The `generate-sitemaps.ts` script generates sitemap files for the RateCreator
website, including a sitemap index file and multiple sitemap files for profile
pages.

### Why Multiple Sitemaps?

With approximately 3 million profile pages, a single sitemap would be too large
and would likely cause timeouts during generation. The script splits the
profiles into multiple sitemap files, each containing up to 10,000 URLs (which
is well below the 50,000 URL limit recommended by Google).

### How to Use

Run the script using the following command:

```bash
yarn generate-sitemaps
```

This will:

1. Generate a sitemap index file (`sitemap-index.xml`) that references all other
   sitemap files
2. Generate multiple sitemap files for profile pages (`sitemap-profiles-0.xml`,
   `sitemap-profiles-1.xml`, etc.)
3. Place all files in the `public` directory, where they can be served
   statically

### Scheduling with Vercel

Since we're using Vercel for deployment, we have two options for scheduling
sitemap generation:

#### Option 1: Vercel Cron Jobs (Recommended)

We've set up a Vercel Cron Job that runs weekly to generate sitemaps
automatically:

1. The cron job is configured in `vercel.json` to run every Sunday at midnight
2. It calls the API route at `/api/cron/generate-sitemaps`
3. The API route executes the sitemap generation logic
4. Generated files are stored in the `public` directory

To set up the cron job:

- Ensure you have a `vercel.json` file with the cron configuration
- Add the `CRON_SECRET` environment variable in your Vercel project settings
- Deploy your application to Vercel

#### Option 2: Manual Generation

You can also generate sitemaps manually:

1. Run the script locally: `yarn generate-sitemaps`
2. Commit the generated files to your repository
3. Deploy to Vercel

### Customization

You can customize the script by modifying the following parameters:

- `CHUNK_SIZE`: The number of URLs per sitemap file (default: 10,000)
- Sorting: Currently, profiles are sorted by review count and follower count to
  prioritize the most important profiles
- Filtering: You can add additional filters to exclude certain profiles

## Next.js Integration

The sitemap.ts file in the app directory handles the main sitemap, which
includes:

- Static routes
- Category routes
- Top 1000 profile routes (for faster generation)

The sitemap-index.ts file serves as an entry point that references all other
sitemap files.

## SEO Best Practices

- Submit your sitemap index URL (`https://ratecreator.com/sitemap-index.xml`) to
  Google Search Console
- Keep your sitemaps up-to-date by regenerating them periodically
- Monitor crawl errors in Google Search Console to ensure your sitemaps are
  being processed correctly
