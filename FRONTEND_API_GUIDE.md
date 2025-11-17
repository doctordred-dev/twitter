# 🎨 Frontend API Guide - Twitter Clone

## 📡 Base URL

```
Production: https://twitter-bny4.onrender.com
Development: http://localhost:3000
```

---

## 🔐 Аутентифікація

### 1. Реєстрація

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "displayName": "Display Name"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "Display Name",
    "emailVerified": false
  },
  "message": "Please check your email to verify your account"
}
```

---

### 2. Логін

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "Display Name",
    "avatarUrl": "https://...",
    "emailVerified": true
  }
}
```

**Cookies:**
- `refreshToken` (httpOnly, secure) - автоматично встановлюється

---

### 3. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Cookies:** `refreshToken` (автоматично)

**Response (200):**
```json
{
  "accessToken": "new_token..."
}
```

---

### 4. Logout

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

---

## 👤 Користувачі

### 1. Отримати свій профіль

**Endpoint:** `GET /users/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "displayName": "Display Name",
  "bio": "My bio",
  "avatarUrl": "https://res.cloudinary.com/...",
  "createdAt": "2025-11-17T00:00:00.000Z"
}
```

---

### 2. Оновити профіль

**Endpoint:** `PATCH /users/me`

**Headers:** 
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request (FormData):**
```javascript
const formData = new FormData();
formData.append('displayName', 'New Name');
formData.append('bio', 'New bio');
formData.append('avatar', fileInput.files[0]); // File object
```

**Response (200):**
```json
{
  "id": "uuid",
  "username": "username",
  "displayName": "New Name",
  "bio": "New bio",
  "avatarUrl": "https://res.cloudinary.com/..."
}
```

---

### 3. Отримати профіль користувача

**Endpoint:** `GET /users/:username`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "uuid",
  "username": "username",
  "displayName": "Display Name",
  "bio": "Bio",
  "avatarUrl": "https://...",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "_count": {
    "posts": 42,
    "followers": 100,
    "following": 50
  },
  "isFollowing": false
}
```

---

### 4. Пошук користувачів

**Endpoint:** `GET /users/search?q=username&limit=20`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "username",
      "displayName": "Display Name",
      "avatarUrl": "https://...",
      "bio": "Bio"
    }
  ]
}
```

---

### 5. Підписатись

**Endpoint:** `POST /users/:id/follow`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

---

### 6. Відписатись

**Endpoint:** `DELETE /users/:id/follow`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

---

### 7. Отримати репости користувача

**Endpoint:** `GET /users/:username/reposts?limit=20&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "text": "Текст поста",
      "imageUrl": "https://...",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "author": { ... },
      "_count": {
        "likes": 5,
        "comments": 3,
        "reposts": 2
      },
      "isLiked": false,
      "isReposted": true,
      "repostedAt": "2025-11-17T01:00:00.000Z",
      "repostComment": "Коментар до репосту" | null
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

### 8. Отримати коментарі користувача

**Endpoint:** `GET /users/:username/replies?limit=20&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "replies": [
    {
      "comment": {
        "id": "uuid",
        "text": "Текст коментаря",
        "createdAt": "2025-11-17T00:00:00.000Z",
        "author": {
          "id": "uuid",
          "username": "username",
          "displayName": "Display Name",
          "avatarUrl": "https://..."
        }
      },
      "post": {
        "id": "uuid",
        "text": "Оригінальний пост",
        "imageUrl": "https://...",
        "author": { ... },
        "_count": {
          "likes": 5,
          "comments": 3,
          "reposts": 2
        },
        "isLiked": false,
        "isReposted": false
      }
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

### 9. Отримати лайки користувача

**Endpoint:** `GET /users/:username/likes?limit=20&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "text": "Текст поста",
      "imageUrl": "https://...",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "author": { ... },
      "_count": {
        "likes": 5,
        "comments": 3,
        "reposts": 2
      },
      "isLiked": true,
      "isReposted": false,
      "likedAt": "2025-11-17T01:00:00.000Z"
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

## 📝 Пости

### 1. Створити пост

**Endpoint:** `POST /posts`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request (FormData):**
```javascript
const formData = new FormData();
formData.append('text', 'Текст поста (до 280 символів)');
formData.append('image', fileInput.files[0]); // Опціонально
```

**Response (201):**
```json
{
  "post": {
    "id": "uuid",
    "text": "Текст поста",
    "imageUrl": "https://res.cloudinary.com/...",
    "createdAt": "2025-11-17T00:00:00.000Z",
    "author": {
      "id": "uuid",
      "username": "username",
      "displayName": "Display Name",
      "avatarUrl": "https://..."
    },
    "_count": {
      "likes": 0,
      "comments": 0,
      "reposts": 0
    },
    "isLiked": false,
    "isReposted": false
  }
}
```

---

### 2. Отримати стрічку постів

**Endpoint:** `GET /posts/feed?limit=10&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `limit` (опціонально) - кількість постів (default: 10)
- `cursor` (опціонально) - для пагінації

**Response (200):**
```json
{
  "posts": [
    {
      "id": "uuid",
      "text": "Текст поста",
      "imageUrl": "https://res.cloudinary.com/...",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "author": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://..."
      },
      "_count": {
        "likes": 5,
        "comments": 3,
        "reposts": 2
      },
      "isLiked": true,
      "isReposted": false
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

### 3. Отримати один пост

**Endpoint:** `GET /posts/:id`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "post": {
    "id": "uuid",
    "text": "Текст поста",
    "imageUrl": "https://...",
    "createdAt": "2025-11-17T00:00:00.000Z",
    "author": { ... },
    "_count": {
      "likes": 5,
      "comments": 3,
      "reposts": 2
    },
    "isLiked": true,
    "isReposted": false
  }
}
```

---

### 4. Лайкнути пост

**Endpoint:** `POST /posts/:id/like`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

---

### 5. Видалити лайк

**Endpoint:** `DELETE /posts/:id/like`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

---

### 6. Видалити пост

**Endpoint:** `DELETE /posts/:id`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

**Примітка:** Soft delete - пост позначається як `isDeleted: true`

---

## 💬 Коментарі

### 1. Створити коментар

**Endpoint:** `POST /posts/:id/comments`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "text": "Текст коментаря"
}
```

**Response (201):**
```json
{
  "comment": {
    "id": "uuid",
    "postId": "uuid",
    "text": "Текст коментаря",
    "createdAt": "2025-11-17T00:00:00.000Z",
    "author": {
      "id": "uuid",
      "username": "username",
      "displayName": "Display Name",
      "avatarUrl": "https://..."
    }
  }
}
```

---

### 2. Отримати коментарі

**Endpoint:** `GET /posts/:id/comments?limit=50&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "comments": [
    {
      "id": "uuid",
      "postId": "uuid",
      "text": "Текст коментаря",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "author": { ... }
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

### 3. Видалити коментар

**Endpoint:** `DELETE /posts/:postId/comments/:commentId`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

**Примітка:** Тільки автор може видалити свій коментар

---

## 🔄 Репости

### 1. Створити репост

**Endpoint:** `POST /posts/:id/repost`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "comment": "Опціональний коментар до репосту"
}
```

**Примітка:** `comment` можна не передавати

**Response (201):**
```json
{
  "repost": {
    "id": "uuid",
    "userId": "uuid",
    "postId": "uuid",
    "comment": "Коментар" | null,
    "createdAt": "2025-11-17T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "username": "username",
      "displayName": "Display Name",
      "avatarUrl": "https://..."
    },
    "post": { ... }
  }
}
```

---

### 2. Видалити репост

**Endpoint:** `DELETE /posts/:id/repost`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "ok": true
}
```

---

### 3. Отримати репости поста

**Endpoint:** `GET /posts/:id/reposts?limit=20&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "reposts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "postId": "uuid",
      "comment": "Коментар" | null,
      "createdAt": "2025-11-17T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://..."
      }
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

## 💬 Чат

### 1. Отримати список діалогів

**Endpoint:** `GET /conversations?limit=20&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "members": [
        {
          "id": "uuid",
          "username": "username",
          "displayName": "Display Name",
          "avatarUrl": "https://..."
        }
      ],
      "lastMessage": {
        "id": "uuid",
        "text": "Останнє повідомлення",
        "createdAt": "2025-11-17T00:00:00.000Z",
        "sender": { ... }
      }
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

### 2. Створити або отримати діалог

**Endpoint:** `POST /conversations`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "participantId": "uuid"
}
```

**Response (200 або 201):**
```json
{
  "conversation": {
    "id": "uuid",
    "createdAt": "2025-11-17T00:00:00.000Z",
    "members": [ ... ]
  }
}
```

---

### 3. Отримати повідомлення

**Endpoint:** `GET /conversations/:id/messages?limit=50&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "text": "Текст повідомлення",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "readAt": null,
      "sender": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://..."
      }
    }
  ],
  "nextCursor": "uuid" // або null
}
```

---

### 4. Відправити повідомлення

**Endpoint:** `POST /conversations/:id/messages`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**
```json
{
  "text": "Текст повідомлення"
}
```

**Response (201):**
```json
{
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "text": "Текст повідомлення",
    "createdAt": "2025-11-17T00:00:00.000Z",
    "sender": { ... }
  }
}
```

---

## 🔔 Сповіщення

### Отримати сповіщення

**Endpoint:** `GET /notifications?limit=20&cursor=uuid`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "like" | "comment" | "repost" | "follow" | "new_message" | "new_post_from_followed",
      "payload": {
        "postId": "uuid",
        "userId": "uuid"
      },
      "isRead": false,
      "createdAt": "2025-11-17T00:00:00.000Z"
    }
  ],
  "nextCursor": "uuid" // або null
}
```

**Типи сповіщень:**
- `like` - хтось лайкнув ваш пост
- `comment` - хтось прокоментував ваш пост
- `repost` - хтось зробив репост вашого поста
- `follow` - хтось підписався на вас
- `new_message` - нове повідомлення
- `new_post_from_followed` - новий пост від підписки

---

## 🌐 WebSocket Events

### Підключення

```typescript
import { io } from 'socket.io-client';

const socket = io('https://twitter-bny4.onrender.com', {
  auth: {
    token: accessToken
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('hello', (data) => {
  console.log('Hello from server:', data);
});
```

---

### Події від сервера

#### 1. Новий пост від підписки

```typescript
socket.on('new_post', ({ post }) => {
  console.log('Новий пост:', post);
  // Додати пост в стрічку
});
```

---

#### 2. Нове повідомлення

```typescript
socket.on('message:new', ({ message }) => {
  console.log('Нове повідомлення:', message);
  // Оновити чат
});
```

---

#### 3. Новий діалог

```typescript
socket.on('conversation:new', ({ conversation }) => {
  console.log('Новий діалог:', conversation);
  // Додати в список діалогів
});
```

---

#### 4. Нове сповіщення

```typescript
socket.on('notification:new', (notification) => {
  console.log('Нове сповіщення:', notification);
  // Показати сповіщення
});
```

---

#### 5. Новий коментар

```typescript
socket.on('post:comment', ({ comment }) => {
  console.log('Новий коментар:', comment);
  // Оновити лічильник коментарів
});
```

---

#### 6. Новий репост

```typescript
socket.on('post:repost', ({ repost }) => {
  console.log('Новий репост:', repost);
  // Оновити лічильник репостів
});
```

---

## 🎨 Оптимізація зображень (Cloudinary)

Всі зображення зберігаються в Cloudinary і можуть бути оптимізовані через URL.

### Базовий URL
```
https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.jpg
```

### Трансформації

#### Resize
```
https://res.cloudinary.com/.../w_600,h_600,c_fill/...
```

#### Quality + Format
```
https://res.cloudinary.com/.../q_auto,f_auto/...
```

#### Комбінація
```
https://res.cloudinary.com/.../w_600,h_600,c_fill,q_auto,f_webp/...
```

### Приклад використання

```typescript
function getOptimizedImageUrl(url: string, width: number, height?: number) {
  if (!url.includes('cloudinary.com')) {
    return url; // Не Cloudinary URL
  }

  const transformation = [
    `w_${width}`,
    height && `h_${height}`,
    'c_fill',
    'q_auto',
    'f_auto'
  ].filter(Boolean).join(',');

  return url.replace('/upload/', `/upload/${transformation}/`);
}

// Використання
const thumbnailUrl = getOptimizedImageUrl(post.imageUrl, 300, 300);
const largeUrl = getOptimizedImageUrl(post.imageUrl, 1200);
```

---

## 🔧 Обробка помилок

### Стандартний формат помилки

```json
{
  "error": "Error message"
}
```

### HTTP статус коди

- `200` - OK
- `201` - Created
- `400` - Bad Request (невалідні дані)
- `401` - Unauthorized (немає токена або токен невалідний)
- `403` - Forbidden (немає прав)
- `404` - Not Found
- `500` - Internal Server Error

### Приклад обробки

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Для cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}
```

---

## 📝 Приклади використання

### Створення поста з зображенням

```typescript
async function createPost(text: string, image?: File) {
  const formData = new FormData();
  formData.append('text', text);
  if (image) {
    formData.append('image', image);
  }

  const response = await fetch('https://twitter-bny4.onrender.com/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: formData,
  });

  const data = await response.json();
  return data.post;
}
```

---

### Infinite scroll для стрічки

```typescript
function useFeed() {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading) return;
    
    setLoading(true);
    const url = `/posts/feed?limit=10${cursor ? `&cursor=${cursor}` : ''}`;
    
    const response = await fetchWithAuth(url);
    
    setPosts(prev => [...prev, ...response.posts]);
    setCursor(response.nextCursor);
    setLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, []);

  return { posts, loadMore, hasMore: !!cursor, loading };
}
```

---

### Real-time оновлення

```typescript
useEffect(() => {
  const socket = io('https://twitter-bny4.onrender.com', {
    auth: { token: accessToken }
  });

  socket.on('new_post', ({ post }) => {
    setPosts(prev => [post, ...prev]);
  });

  socket.on('notification:new', (notification) => {
    showNotification(notification);
  });

  return () => {
    socket.disconnect();
  };
}, [accessToken]);
```

---

## ✅ Готово!

Це повна документація API для фронтенду. Всі endpoints працюють і готові до використання! 🚀
