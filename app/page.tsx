"use client";

import { useEffect, useState } from "react";

// ============= TYPES =============

interface HackerNewsStory {
  by: string;
  id: number;
  kids?: number[];
  score: number;
  time: number;
  title: string;
  type: string;
  url: string;
  text?: string;
  descendants?: number;
}

/*
{
  "by" : "norvig",
  "id" : 2921983,
  "kids" : [ 2922097, 2922429, 2924562, 2922709, 2922573, 2922140, 2922141 ],
  "parent" : 2921506,
  "text" : "Aw shucks, guys ... you make me blush with your compliments.<p>Tell you what, Ill make a deal: I'll keep writing if you keep reading. K?",
  "time" : 1314211127,
  "type" : "comment"
}

*/
interface HackerNewsComment {
  by: string;
  id: number;
  kids?: number[];
  parent?: number;
  text?: string;
  time: number;
  type: string;
}

// ============= UTILITY FUNCTIONS =============

function formatTimeToUTC(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  return date.toUTCString();
}

function decodeHTMLEntities(text: string): string {
  // Create a temporary DOM element to leverage browser's HTML decoding
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  let decoded = textarea.value;

  // Remove HTML tags
  decoded = decoded.replace(/<[^>]*>/g, "");

  // Decode any remaining HTML entities
  decoded = decoded
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'");

  return decoded;
}

// ============= COMPONENTS =============

interface RecursiveCommentProps {
  comment_id: number;
  depth?: number;
}

function RecursiveComment({ comment_id, depth = 0 }: RecursiveCommentProps) {
  const [comment, setComment] = useState<HackerNewsComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedKids, setExpandedKids] = useState<Record<number, boolean>>({});
  const [showParent, setShowParent] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchComment = async (): Promise<void> => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${comment_id}.json`
        );
        const comment_data: HackerNewsComment = await response.json();
        setComment(comment_data);
      } catch (err) {
        setError(true);
        console.error("Error fetching comment:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComment();
  }, [comment_id]);

  if (!comment && !loading && !error) {
    return null;
  }

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
        Loading...
      </div>
    );
  }

  if (error || !comment) {
    return (
      <div className="px-3 py-2 text-xs text-red-500 dark:text-red-400">
        Error loading comment
      </div>
    );
  }

  const marginStyle = { marginLeft: `${depth * 16}px` };

  return (
    <div style={marginStyle} className="mt-3">
      {/* Main Comment with Parent Context */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-zinc-200 dark:border-zinc-700">
        {/* Parent Quote Reference */}
        {comment.parent && (
          <button
            onClick={() => setShowParent(!showParent)}
            className="mb-3 w-full text-left px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 dark:border-purple-600 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">
              {showParent ? "▼ Hide parent" : "▶ Replying to parent comment"}
            </div>
            {!showParent && (
              <div className="text-xs text-purple-600 dark:text-purple-300 italic line-clamp-2">
                Click to view parent comment (id: {comment.parent})
              </div>
            )}
          </button>
        )}

        {/* Parent Comment Preview */}
        {showParent && comment.parent && (
          <div className="mb-3 pl-3 border-l-4 border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/10 rounded">
            <RecursiveComment comment_id={comment.parent} depth={0} />
          </div>
        )}
        {/* Comment Header */}
        <div className="flex justify-between items-start gap-2 text-xs mb-2">
          <div>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {comment.by || "[deleted]"}
            </span>
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">
            {formatTimeToUTC(comment.time)}
          </span>
        </div>

        {/* Comment Text */}
        {comment.text && (
          <div className="text-xs text-zinc-700 dark:text-zinc-300 mb-2 ">
            {decodeHTMLEntities(comment.text)}
          </div>
        )}

        {/* Comment Type and ID */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          type: {comment.type} • id: {comment.id}
        </div>

        {/* Nested Comments */}
        {comment.kids && comment.kids.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => {
                const newExpandedKids: Record<number, boolean> = {};
                comment.kids?.forEach((kid_id) => {
                  newExpandedKids[kid_id] = !expandedKids[kid_id];
                });
                setExpandedKids(newExpandedKids);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50 rounded transition-colors cursor-pointer mb-2"
            >
              <span>
                {Object.values(expandedKids).some(Boolean) ? "▼" : "▶"}
              </span>
              <span>
                {comment.kids.length}{" "}
                {comment.kids.length === 1 ? "reply" : "replies"}
              </span>
            </button>

            {Object.values(expandedKids).some(Boolean) && (
              <div className="space-y-2 mt-2">
                {comment.kids.map((kid_id) => (
                  <div key={kid_id}>
                    {expandedKids[kid_id] ? (
                      <RecursiveComment comment_id={kid_id} depth={depth + 1} />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface StoryCardProps {
  story: HackerNewsStory;
}

function StoryCard({ story }: StoryCardProps) {
  const [viewComments, setViewComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const handleViewComments = async (): Promise<void> => {
    setLoadingComments(true);
    try {
      // Fetch all comments in parallel from the kids array
      await Promise.all(
        (story.kids || []).map((comment_id) =>
          fetch(
            `https://hacker-news.firebaseio.com/v0/item/${comment_id}.json`
          ).catch(() => null)
        )
      );
      setViewComments(true);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <div className="h-full p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      {/* Title */}
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-3 transition-colors">
        {story.title}
      </h2>

      {/* URL Display */}
      {story.url && (
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 mt-2 line-clamp-1 hover:underline break-all inline-block max-w-full truncate"
          title={story.url}
        >
          {story.url}
        </a>
      )}

      {/* Divider */}
      <div className="my-4 h-px bg-zinc-100 dark:bg-zinc-800"></div>

      {/* Story Metadata */}
      <div className="space-y-3 text-sm">
        {/* Score */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            score:
          </span>
          <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
            {story.score}
          </span>
        </div>

        {/* Descendants */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            descendants:
          </span>
          <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
            {story.descendants || 0}
          </span>
        </div>

        {/* Author */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            by:
          </span>
          <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
            {story.by}
          </span>
        </div>

        {/* Time */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            time:
          </span>
          <span className="text-zinc-900 dark:text-zinc-50 font-semibold text-xs">
            {formatTimeToUTC(story.time)}
          </span>
        </div>

        {/* Type */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            type:
          </span>
          <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
            {story.type}
          </span>
        </div>

        {/* ID */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            id:
          </span>
          <span className="text-zinc-900 dark:text-zinc-50 font-semibold text-xs">
            {story.id}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-zinc-100 dark:bg-zinc-800"></div>

      {/* Comments Section */}
      {story.kids && story.kids.length > 0 && (
        <div>
          {!viewComments && !loadingComments ? (
            <button
              onClick={handleViewComments}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors cursor-pointer"
            >
              View Comments ({story.kids.length})
            </button>
          ) : loadingComments ? (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Loading {story.kids.length} comments...
            </div>
          ) : (
            <div>
              <button
                onClick={() => setViewComments(false)}
                className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors cursor-pointer mb-3"
              >
                Hide Comments
              </button>
              <div className="space-y-2">
                {story.kids.map((comment_id, index) => (
                  <RecursiveComment
                    key={index}
                    comment_id={comment_id}
                    depth={0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [stories, setStories] = useState<HackerNewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stories_array_id, setStories_array_id] = useState<number[]>([]);
  const BATCH_SIZE = 10;

  // Fetch initial stories
  useEffect(() => {
    async function fetchInitialStories(): Promise<void> {
      try {
        const response = await fetch(
          "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty"
        );

        const stories_ids: number[] = await response.json();
        setStories_array_id(stories_ids);

        // Fetch first batch
        await fetchBatch(stories_ids, 0);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialStories();
  }, []);

  // Fetch batch of stories
  async function fetchBatch(
    story_ids: number[],
    startIndex: number
  ): Promise<void> {
    const endIndex = startIndex + BATCH_SIZE;
    const batch_ids = story_ids.slice(startIndex, endIndex);

    const data_fetched = await Promise.all(
      batch_ids.map(async (story_id: number) => {
        const fetch_story = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${story_id}.json`
        );
        const data_fetched: HackerNewsStory = await fetch_story.json();
        console.log(" story fetched ", data_fetched);
        return data_fetched;
      })
    );
    const filtered_stories = data_fetched.filter(Boolean) as HackerNewsStory[];

    setStories((prev) => [...prev, ...filtered_stories]);
    setCurrentIndex(endIndex);
  }

  // Handle scroll event
  const handleScroll = (): void => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // If user scrolled to 80% of page, load more stories
    if (
      scrollTop + windowHeight >= documentHeight * 0.8 &&
      !isFetchingMore &&
      currentIndex < stories_array_id.length
    ) {
      setIsFetchingMore(true);
      fetchBatch(stories_array_id as number[], currentIndex).then(() => {
        setIsFetchingMore(false);
      });
    }
  };

  // Add scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isFetchingMore, currentIndex, stories_array_id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-950 font-sans">
        <div className="text-center">
          <p className="text-zinc-700 dark:text-zinc-300 text-lg font-medium">
            Loading top stories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-950 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Total Stories:
                </span>
                <span className="ml-2 font-bold text-zinc-900 dark:text-white text-lg">
                  {stories_array_id.length}
                </span>
              </div>
              <div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Stories Fetched:
                </span>
                <span className="ml-2 font-bold text-blue-600 dark:text-blue-400 text-lg">
                  {stories.length}
                </span>
              </div>
              <div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Stories Remaining:
                </span>
                <span className="ml-2 font-bold text-orange-600 dark:text-orange-400 text-lg">
                  {Math.max(0, stories_array_id.length - currentIndex)}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 italic">
              💡 Keep scrolling to load more stories
            </p>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {stories.map((story, index) => (
            <StoryCard key={index} story={story} />
          ))}
        </div>

        {/* Loading More Indicator */}
        {isFetchingMore && (
          <div className="flex justify-center items-center mt-12">
            <div className="animate-spin text-3xl">⏳</div>
            <p className="ml-3 text-zinc-600 dark:text-zinc-400">
              Loading more stories...
            </p>
          </div>
        )}

        {/* End of Stories */}
        {currentIndex >= stories_array_id.length &&
          stories_array_id.length > 0 && (
            <div className="flex justify-center mt-12">
              <p className="text-zinc-600 dark:text-zinc-400">
                ✨ You&apos;ve reached the end of top stories
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
