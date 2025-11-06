# Introduction

Please kindly read this file as I mentioned a lot of details relevant for this challenge.

I have pushed this to production in Vercel server and you can clone this repo and set it up by:

1. Type "cd my-app" in terminal to go to the directory
2. Type "pnpm i" in terminal to install the dependencies
3. Type "pnpm run dev" to run the development server.
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

For the sake of setup simplicity, I avoided using third-party packages such as react intersection observer, shadcn UI for beautiful components, etc. All the code for the assignment is in one single page which is page.tsx.

# Talking About Challenges and Solutions

Since this assignment was open-ended with less instructions on what to display, which format, whether we care about UX and performance, etc., I therefore followed a UX-first approach where I was trying to display legible text and treated it almost like a production website that needs to be fast. I have not tested for responsiveness, however.

I will talk about two core challenges I faced and how I solved them.

### First Challenge: Displaying Such a Huge List

During my live interview, without any optimizations, the interviewer could see what a bad amount of time it was taking to display the 500 stories! Such an approach is not even considered 1% eligible to be in a production website.

So I had to refactor and approach the UX to apply infinite scrolling rather than pagination since the objective was to see all the stories. I thought infinite scrolling would be better than pagination, and plus I have implemented a similar approach in my enterprise production website on the search page which is https://teachx.net/search-tutors. This website has been used hundreds of times with really good feedback from users. Therefore, I have personal data to back up the infinite scrolling approach and thus implemented it here.

If you noticed the header, i mention the stats which is how many total stories, stories fetched and remaining to be fetched

### The Challenge: Infinite Comment Trees

Another issue that I was facing is with the comment section.

Once again, due to the open-ended nature of the assignment, I didn't know whether to display the comment IDs or the comments themselves. Therefore, I took a UX approach which is to fetch the comment IDs "data" so that if this website is in production, users see meaningful texts which are the comments themselves.

But when I first started building the comments feature, I noticed the comments aren't flat lists—they're deeply nested trees.

Each comment can have replies (stored in a `kids` array), and those replies can have their own replies, creating unpredictable depth of nesting. For this approach, I had to opt for a tree data structure as trees have parents, child nodes, and depth from the parent to a child.

### Solution: Opt for Recursive Components

Therefore, I opted for a recursive component due to the fact that the data structure is a tree. The recursive component eased a lot of headache since you just think about one single component and understand that it can have a parent and child. Therefore, I add appropriate icons and UI styles by just focusing on a single comment without overwhelming my mind.

### Loading Problem: Sequential vs. Parallel Loading

My first instinct was to fetch comments one-by-one as users clicked through them. But I quickly realized this would create a terrible user experience—clicking "View Comments" and waiting for each comment to load individually would feel sluggish.

**Solution:** I switched to parallel fetching using `Promise.all()` just like I did for fetching the initial stories to improve user experience. When a user clicks "View Comments", the app now fetches ALL top-level comments simultaneously, dramatically improving perceived performance.

### The Recursion Problem: How Deep Should I Display?

Initially, I wasn't sure how to properly display the nested replies. I considered several approaches:

1. **Load all replies upfront** - Fetch the entire tree at once (performance nightmare)
2. **Lazy recursive loading** - Load comments only when needed (✓ This is what I did)

I chose **lazy recursive loading** because it scales infinitely without killing performance. Each `RecursiveComment` component is a self-contained unit that:

- Fetches its own data on mount
- Knows how to render its own children
- Passes props to child components

### The Parent-Child UI Connection Challenge

Now, every comment has a `parent` field that indicates what it's replying to. The problem was how to display the UI:

1. Show a separate "View Parent" button?
2. Display the parent inline?

At first, I was using a UI approach where there would be a button saying "view parent" directly above the child, and clicking on it would show the parent so the parent and child would be next to one another in a vertical manner. But with more nested parents and children, it got confusing.

Since I am focused on UX, I researched and applied YouTube's new UI for displaying nested comments where they connect the parent and children through a line.

**The Solution:** So I added an inline quoted parent display using:

- A purple left border to visually indicate a quote/reference
- A collapsible button that says "Replying to parent comment"
- The parent renders inside a quote box within the same component
- Users can toggle it open/closed without navigating away

This keeps the full context visible and shows the conversation flow in one glance just like the new YouTube UI.

I also made sure to fetch nested children only when interacting with the expanded button to improve UX.

### Another Problem: HTML Entity Escaping

I noticed the comment text having weird Unicode escape sequences like `\u003Cp\u003E` mixed with HTML entities like `&amp;` and `&nbsp;`. Since I have taken a UX approach, I had to research how to remove and display legible texts rather than the escape characters.

**The Solution:** I created a `decodeHTMLEntities()` function that:

1. Uses the browser's DOM to automatically decode HTML
2. Removes remaining HTML tags
3. Manually replaces any remaining HTML entities

From my knowledge, I think I covered most Unicode escape characters.

### Summary

The best part of this assignment was how I was able to think from a UX perspective and apply those changes. Since when I am dealing with production websites, UX is one of the biggest centers of focus since what use is a website that has a low lead conversion rate due to performance issues and improper UI layouts?

Many lessons that I learned when building TeachX.net, an enterprise EdTech website, have helped me here.

The time displayed are in UTC since UTC is the base or central point of time reference that you can use to implement timezone features in an international website which i have done in teachx.net as well. Again i applied this based on an UX first approach to this assignment

Please let me know any questions you have or why i have taken certain approaches and i would be happy to explain



