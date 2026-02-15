# GrapFene Comprehensive Architecture Documentation

This document serves as the single source of truth for the GrapFene architecture, detailing every feature, route, and component across the Frontend and Backend.

---

## 1. Frontend Architecture
**Tech Stack:** React (Vite), TypeScript, Tailwind CSS, Axios, React Router.

### **1.1 Pages (Routes)**
Each page is mapped to a specific route in `App.tsx`.

| Page Component | Route | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `HomePage` | `/` | The main landing page. | • Displays the Global Feed (recent/trending)<br>• Sidebar with "Trending Today" & "Top Communities"<br>• Create Post button<br>• Filter bar |
| `CommunityPage` | `/r/:name` | Canvases a specific subreddit. | • Headers with "Join/Leave" and "Block/Unblock" buttons<br>• List of community-specific posts<br>• Community description |
| `PostDetailsPage` | `/posts/:id` | Single post view. | • Full post content (text/media)<br>• Voting interface<br>• Nested Comment threads (Tree view)<br>• Reply functionality |
| `CreatePostPage` | `/submit` | Form to create content. | • Title & Body inputs<br>• Subreddit selector<br>• Media upload (Image/Video)<br>• Markdown preview support |
| `LoginPage` | `/login` | User entry point. | • Username/Password login form<br>• "Forgot Password" link<br>• Redirects to Home on success |
| `RegisterPage` | `/register` | New user creation. | • Generates DID (Decentralized ID)<br>• Mnemonic generation & backup display<br>• Password hashing |
| `RecoveryPage` | `/recovery` | Account recovery. | • Mnemonic phrase input to restore access |
| `ProfilePage` | `/profile` | User dashboard. | • View own posts<br>• View reputation score<br>• Edit profile settings |
| `SearchPage` | `/search` | Global search results. | • Search results for posts and communities |

### **1.2 Components (UI Blocks)**
Reusable UI elements found in `src/components`.

*   **`Header`**: Navigation bar containing Logo, Search Bar, "Create Post" button, and User Profile dropdown.
*   **`Sidebar`**:
    *   **Trending Today**: Hardcoded/Dynamic list of hot topics.
    *   **Top Communities**: List of communities fetched from backend. Includes **Join/Leave** toggle buttons.
*   **`PostCard`**: Displays a summary of a post (Title, Author, Subreddit, Vote Count, Thumbnail). Click to view details.
*   **`FilterBar`**: Toggles between "Best", "Hot", "New", "Top" sort orders.
*   **`CreateCommunityModal`**: A popup form to create a new subreddit (Name, Description, Rules).
*   **`MobileMenu`**: Responsive navigation drawer for smaller screens.

### **1.3 Client-Side Service Layer (`src/services/api.ts`)**
This file abstracts all HTTP communication.

#### **Core Functions**
*   **Auth**: `register`, `loginInit` (Challenge fetch), `loginVerify` (Challenge response).
*   **Feed**:
    *   `getFeed(sort, viewerDid)`: Fetches global posts.
    *   `getPostsByCommunity(name)`: Fetches posts for a specific subreddit.
    *   `getPostDetails(id)`: Fetches a single post + comments.
*   **Actions**:
    *   `createPost`: Handles file upload (`/upload`) first if media exists, then creates post.
    *   `vote`: Up/Down vote on posts.
    *   `createComment`: Posts a comment (or reply) to a thread.
*   **Community Management**:
    *   `joinCommunity(name)` / `leaveCommunity(name)` / `getSubscribedCommunities`: Subscription management.
    *   `blockCommunity(name)` / `unblockCommunity(name)` / `getBlockedCommunities`: Moderation.
    *   `getTopCommunities`: For sidebar discovery.
    *   `createCommunity`: For user-generated subreddits.

---

## 2. Backend Architecture
**Tech Stack:** Node.js, Express, Supabase (PostgreSQL), Ethers.js (Crypto).

### **2.1 API Route Map**
All routes are prefixed with the base URL (e.g., `/auth`, `/posts`).

#### **Auth (`/auth`)** - *`routes/auth.ts`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/challenge` | Generates a cryptographic nonce for DID login. |
| `POST` | `/login` | Verifies signed nonce and issues JWT. |
| `POST` | `/register` | Creates new DID identity, keys, and username. |
| `POST` | `/login-init` | Starts password-based login (returns mnemonic indices). |
| `POST` | `/login-verify` | Verifies mnemonic words and issues JWT. |

#### **Posts (`/posts`)** - *`routes/post.ts`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | **Global Feed.** Supports `?sort=` & `?subreddit=`. Filters out blocked communities. |
| `GET` | `/:id` | **Single Post.** Returns Post + Vote Score + Comments. |
| `POST` | `/` | **Create Post.** Stores content & media. Signs data for federation. |
| `POST` | `/:id/vote` | **Vote.** Up/Down/Unvote a post. |

#### **Communities (`/communities`)** - *`routes/community.ts`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | **Search.** Search communities by name/text. |
| `GET` | `/top` | **Trending.** Returns top N communities by subscriber count. |
| `POST` | `/` | **Create.** Register a new subreddit. |
| `GET` | `/:name` | **Metadata.** Get description, rules, owner info. |
| `PUT` | `/:name/rules` | **Update Rules.** (Owner only). |

#### **Subscriptions (`/subscriptions`)** - *`routes/subscription.ts`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/subscribe` | User **Joins** a community. |
| `POST` | `/unsubscribe` | User **Leaves** a community. |
| `GET` | `/list` | Returns list of communities the user has joined. |
| `GET` | `/feed` | (Optional) specialized personalized feed endpoint. |

#### **Blocks (`/blocks`)** - *`routes/block.ts`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Blocks a community for the current user. |
| `GET` | `/` | Lists all blocked communities. |
| `DELETE` | `/:name` | Unblocks a community. |

#### **Comments (`/comments`)** - *`routes/comment.ts`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Creates a comment/reply. |
| `POST` | `/:id/vote` | Votes on a comment. |
| `GET` | `/:postId` | (Often handled via `/posts/:id` includes, but this exists for pagination). |

#### **Federation (`/federation`)** - *`routes/federation.ts`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/inbox` | Receives signed posts from other instances (ActivityPub-like). |
| `GET` | `/outbox` | Public feed for other instances to crawl. |

#### **Others**
*   `/votes`: Direct vote manipulation (rarely used directly).
*   `/proposals`: Governance/DAO voting endpoints.
*   `/profile`: User profile management.
*   `/moderation`: Mod tools (ban/warn).
*   `/recovery`: Handling account recovery logic.
*   `/upload`: Handles file uploads to storage (returns URL).

---

## 3. Detailed Data Models

### **Identity (User)**
*   `did` (PK): Decentralized Identifier.
*   `username`: Unique handle.
*   `reputation`: Calculated score based on contribution.

### **Post**
*   `id` (PK), `author_did`, `subreddit`, `title`, `content`.
*   `media_url`, `media_type`.
*   `signature`: Cryptographic proof of authorship.

### **Community**
*   `name` (PK): Subreddit name.
*   `owner_did`: Creator.
*   `rules`: JSON blob of community rules.
*   `is_private`: Boolean.

### **Subscription**
*   `subscriber_did` (FK User).
*   `subreddit` (FK Community).

### **Vote**
*   `post_id` / `comment_id`.
*   `voter_did`.
*   `vote_type` (1 or -1).
