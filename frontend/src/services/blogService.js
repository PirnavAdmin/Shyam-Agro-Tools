import axios from '../api/axios';

export const BLOG_API_BASE_URL = (
  process.env.REACT_APP_BLOG_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');

const BLOG_ENDPOINT = `${BLOG_API_BASE_URL}/api/Blog`;

const requestConfig = {
  skipAuth: true,
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

let blogsRequest;

const getFirstValue = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

export const getBlogImageUrl = (coverImage) => {
  if (!coverImage || typeof coverImage !== 'string' || !coverImage.trim()) {
    return null;
  }

  if (coverImage.startsWith('http') || coverImage.startsWith('data:image') || coverImage.startsWith('blob:')) {
    return coverImage;
  }

  return `${BLOG_API_BASE_URL}${coverImage.startsWith('/') ? '' : '/'}${coverImage}`;
};

const extractBlogs = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.blogs)) return data.blogs;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.blogs)) return data.data.blogs;
  return [];
};

export const normalizeBlog = (blog = {}, index = 0) => {
  const id = getFirstValue(blog, ['id', 'Id', 'blogId', 'BlogId']) || `blog-${index}`;
  const title = getFirstValue(blog, ['title', 'Title', 'blogTitle', 'BlogTitle', 'name', 'Name']);
  const description = getFirstValue(blog, [
    'description',
    'Description',
    'content',
    'Content',
    'body',
    'Body',
    'details',
    'Details',
  ]);
  const summary = getFirstValue(blog, ['summary', 'Summary', 'shortDescription', 'ShortDescription', 'excerpt', 'Excerpt'])
    || String(description).slice(0, 150);
  const coverImage = getFirstValue(blog, [
    'coverImage',
    'CoverImage',
    'coverImageUrl',
    'CoverImageUrl',
    'imageUrl',
    'ImageUrl',
    'image',
    'Image',
    'thumbnail',
    'Thumbnail',
  ]);

  return {
    id: String(id),
    title,
    summary,
    description,
    coverImage,
    coverImageUrl: getBlogImageUrl(coverImage),
    authorName: getFirstValue(blog, ['authorName', 'AuthorName', 'author', 'Author', 'createdBy', 'CreatedBy']) || 'Shyam Agro',
    category: getFirstValue(blog, ['category', 'Category', 'categoryName', 'CategoryName']) || 'Agriculture',
    publishDate: getFirstValue(blog, ['publishDate', 'PublishDate', 'publishedAt', 'PublishedAt', 'createdAt', 'CreatedAt']),
    isActive: blog.isActive ?? blog.IsActive ?? blog.active ?? blog.Active,
    raw: blog,
  };
};

const normalizeBlogsResponse = (data) => (
  extractBlogs(data)
    .map(normalizeBlog)
    .filter((blog) => blog.title || blog.summary || blog.description)
    .filter((blog) => blog.isActive !== false)
);

export const getBlogs = async () => {
  if (!blogsRequest) {
    blogsRequest = axios.get(BLOG_ENDPOINT, requestConfig).finally(() => {
      blogsRequest = null;
    });
  }

  const response = await blogsRequest;
  return normalizeBlogsResponse(response.data);
};
