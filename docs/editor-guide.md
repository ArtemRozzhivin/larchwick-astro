# Editor guide

How to change the Larchwick website without a developer. Everything is edited in Sanity Studio
at https://larchwick.sanity.studio (sign in with your Sanity account).

## How publishing works

- The Studio saves every change as a **draft** as you type. Drafts never reach the website.
- **Publish** (bottom right) makes the change official. Sanity then tells Cloudflare to rebuild
  the site, and the live site updates by itself a few minutes later. Unpublishing or deleting a
  document triggers the same rebuild.
- If a rebuild fails (for example because of a broken redirect, see below), the website simply
  keeps the previous version. Nothing goes offline; fix the problem and publish again.

The menu on the left: **Site settings** (name, menu, contact details, opening hours), **Pages**,
**Posts**, **Categories**, **Tags** and **Redirects**.

## Add a blog post

1. Open **Posts** and click the pencil icon (Create).
2. Fill in, top to bottom:
   - **Title**: the heading of the post.
   - **Slug**: click **Generate**. This becomes the address, `/blog/<slug>/`. Don't change it
     after publishing; if you must, add a redirect from the old address.
   - **Published**: the date shown on the post. Posts are listed newest first.
   - **Excerpt**: one or two sentences for blog cards, under 200 characters.
   - **Main image**: upload a photo, then write its **Alt text** (what the photo shows, about
     125 characters). Tick **Decorative only** just for a background behind text.
   - **Categories**: at least one. **Tags** are optional.
   - **Body**: the article. Use the style menu for headings, and the + menu for images,
     galleries, quotes, callouts and tables.
3. Click **Publish**. The post appears at `/blog/<slug>/`, on the blog page, in its category and
   tag pages, and on the home page if it is one of the three newest.

## Edit a section on a page

1. Open **Pages** and pick the page (Home is "Home").
2. Under **Sections** each block of the page is listed top to bottom. Click one to edit it, drag
   the handle to reorder, or use **Add item** for a new block. The first section is the hero and
   holds the page heading.
3. A few blocks have options worth knowing:
   - **Hero**: **Style** Cover (home, the biggest heading) or Banner (inner pages). Fill in
     **Coffee label** to show a coffee bag label and its round stamp instead of the photo.
   - **Cards**: **Layout** Cards (labels with photos and details) or Bags (coffee bags; each
     card's **Roast** sets the bag colour, and photos are not shown).
   - **Call to action**: a heading, or a **Quote** with **Who said it**, plus one or two buttons.
     Only quote fictional people: Larchwick is a demo business.
4. Click **Publish**.

## Change a page's search and sharing details

1. Open the page or post and switch to the **SEO** tab at the top.
2. Fill in what you want to change:
   - **Meta title**: the title in search results, under 60 characters. Empty uses the page
     title.
   - **Meta description**: the snippet under the title, 70–160 characters.
   - **Social image**: shown when the page is shared, 1200 × 630. Empty uses the site default.
   - **Hide from search engines**: tick only for pages that shouldn't be found (it also leaves
     them out of the sitemap).
   - **Canonical URL**: leave empty unless this content was first published on another site.
3. Click **Publish**.

## Add a redirect

Use a redirect when an address changes or a page is removed, so old links and search results
still work.

1. Open **Redirects** and click Create.
2. **From**: the old address, starting and ending with `/`, e.g. `/old-post/`. The home page `/`
   and addresses with `?` can't be redirected.
3. **To**: where visitors should land, a site address such as `/blog/` or a full `https://`
   address.
4. Keep **Permanent (301)** on for moved content. Turn it off only for a temporary move.
5. Click **Publish**.

The rebuild checks every redirect and stops (leaving the previous site live) if one would never
work: the same **From** twice, a **From** that is still a live page, or a redirect to an address
that itself redirects. Point **To** at the final address instead.

## Good habits

- Write alt text for every photo; screen readers and search engines rely on it.
- Keep headings short. The site's display font is condensed and large.
- Check the live page a few minutes after publishing.
