# 📸 Uploadcare - Інструкція для фронтенду

## 🎯 Що змінилось для фронтенду?

**Коротка відповідь:** Майже нічого! API залишився таким самим, але тепер зображення зберігаються в Uploadcare CDN замість локального сервера.

---

## 📡 API Endpoints (без змін)

### 1. Створення поста з зображенням

**Endpoint:** `POST /posts`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request (FormData):**
```javascript
const formData = new FormData();
formData.append('text', 'Текст поста');
formData.append('image', fileInput.files[0]); // File object

fetch('https://twitter-bny4.onrender.com/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include',
  body: formData
});
```

**Response:**
```json
{
  "post": {
    "id": "uuid",
    "text": "Текст поста",
    "imageUrl": "https://ucarecdn.com/12345678-1234-1234-1234-123456789abc/",
    "author": { ... },
    "_count": { "likes": 0, "comments": 0 },
    "isLiked": false
  }
}
```

**Що змінилось:**
- ✅ `imageUrl` тепер починається з `https://ucarecdn.com/` замість `http://localhost:3000/uploads/`
- ✅ Зображення доступні через CDN по всьому світу
- ✅ Швидша загрузка зображень

---

### 2. Оновлення аватара

**Endpoint:** `PATCH /users/me`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request (FormData):**
```javascript
const formData = new FormData();
formData.append('displayName', 'Нове ім\'я');
formData.append('bio', 'Нове біо');
formData.append('avatar', avatarFile); // File object

fetch('https://twitter-bny4.onrender.com/users/me', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include',
  body: formData
});
```

**Response:**
```json
{
  "id": "uuid",
  "username": "username",
  "displayName": "Нове ім'я",
  "bio": "Нове біо",
  "avatarUrl": "https://ucarecdn.com/87654321-4321-4321-4321-210987654321/"
}
```

---

## 🎨 Трансформації зображень (нова можливість!)

Uploadcare дозволяє трансформувати зображення "на льоту" через URL. Це означає, що ти можеш отримати різні розміри одного зображення без додаткових запитів до API!

### Базовий URL
```
https://ucarecdn.com/{uuid}/
```

### Приклади трансформацій

#### 1. Resize (зміна розміру)
```javascript
// Оригінал
const originalUrl = "https://ucarecdn.com/12345678-1234-1234-1234-123456789abc/";

// Thumbnail 300x300 для ленти
const thumbnailUrl = `${originalUrl}-/resize/300x300/`;

// Середній розмір 600x600 для модального вікна
const mediumUrl = `${originalUrl}-/resize/600x600/`;

// Великий розмір 1200px по ширині (висота автоматично)
const largeUrl = `${originalUrl}-/resize/1200x/`;
```

#### 2. Crop (обрізка)
```javascript
// Crop 500x500 з центру
const croppedUrl = `${originalUrl}-/crop/500x500/center/`;

// Crop з конкретної позиції
const croppedUrl2 = `${originalUrl}-/crop/500x500/100,100/`;
```

#### 3. Quality (якість)
```javascript
// Smart якість (автоматична оптимізація)
const smartUrl = `${originalUrl}-/quality/smart/`;

// Конкретна якість (0-100)
const quality80Url = `${originalUrl}-/quality/80/`;

// Найкраща якість
const bestUrl = `${originalUrl}-/quality/best/`;
```

#### 4. Format (формат)
```javascript
// Конвертація в WebP (менший розмір)
const webpUrl = `${originalUrl}-/format/webp/`;

// Конвертація в JPEG
const jpegUrl = `${originalUrl}-/format/jpeg/`;

// Конвертація в PNG
const pngUrl = `${originalUrl}-/format/png/`;
```

#### 5. Комбінації (найпотужніше!)
```javascript
// Resize + Crop + Quality + Format
const optimizedUrl = `${originalUrl}-/resize/800x800/-/crop/800x800/center/-/quality/smart/-/format/webp/`;

// Для аватарів: круглий crop + resize + webp
const avatarUrl = `${originalUrl}-/scale_crop/200x200/center/-/format/webp/`;

// Для превью постів: resize + smart quality
const postPreviewUrl = `${originalUrl}-/resize/600x/-/quality/smart/-/format/webp/`;
```

---

## 💡 Практичні приклади для React

### Компонент PostImage

```typescript
interface PostImageProps {
  imageUrl: string;
  alt: string;
  size?: 'thumbnail' | 'medium' | 'large' | 'full';
}

export function PostImage({ imageUrl, alt, size = 'medium' }: PostImageProps) {
  // Генеруємо URL залежно від розміру
  const getImageUrl = (url: string, size: string) => {
    if (!url.includes('ucarecdn.com')) {
      // Якщо це локальне зображення, повертаємо як є
      return url;
    }

    const transformations = {
      thumbnail: '-/resize/300x300/-/quality/smart/-/format/webp/',
      medium: '-/resize/600x600/-/quality/smart/-/format/webp/',
      large: '-/resize/1200x/-/quality/smart/-/format/webp/',
      full: '-/quality/best/'
    };

    return `${url}${transformations[size]}`;
  };

  const srcSet = imageUrl.includes('ucarecdn.com') ? `
    ${getImageUrl(imageUrl, 'thumbnail')} 300w,
    ${getImageUrl(imageUrl, 'medium')} 600w,
    ${getImageUrl(imageUrl, 'large')} 1200w
  ` : undefined;

  return (
    <img
      src={getImageUrl(imageUrl, size)}
      srcSet={srcSet}
      sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
      alt={alt}
      loading="lazy"
    />
  );
}
```

### Компонент Avatar

```typescript
interface AvatarProps {
  avatarUrl: string | null;
  username: string;
  size?: number;
}

export function Avatar({ avatarUrl, username, size = 40 }: AvatarProps) {
  const getAvatarUrl = (url: string | null, size: number) => {
    if (!url) {
      // Fallback на placeholder
      return `https://ui-avatars.com/api/?name=${username}&size=${size}`;
    }

    if (!url.includes('ucarecdn.com')) {
      return url;
    }

    // Круглий crop + оптимізація
    return `${url}-/scale_crop/${size}x${size}/center/-/format/webp/-/quality/smart/`;
  };

  return (
    <img
      src={getAvatarUrl(avatarUrl, size)}
      alt={username}
      width={size}
      height={size}
      className="rounded-full"
      loading="lazy"
    />
  );
}
```

### Хук для оптимізації зображень

```typescript
export function useOptimizedImage(imageUrl: string | null) {
  if (!imageUrl || !imageUrl.includes('ucarecdn.com')) {
    return {
      thumbnail: imageUrl,
      medium: imageUrl,
      large: imageUrl,
      full: imageUrl
    };
  }

  return {
    thumbnail: `${imageUrl}-/resize/300x300/-/quality/smart/-/format/webp/`,
    medium: `${imageUrl}-/resize/600x600/-/quality/smart/-/format/webp/`,
    large: `${imageUrl}-/resize/1200x/-/quality/smart/-/format/webp/`,
    full: `${imageUrl}-/quality/best/`
  };
}

// Використання
function PostCard({ post }) {
  const images = useOptimizedImage(post.imageUrl);
  
  return (
    <div>
      <img src={images.medium} alt="Post" />
      <button onClick={() => openModal(images.large)}>
        Переглянути повний розмір
      </button>
    </div>
  );
}
```

---

## 🚀 Оптимізація завантаження

### 1. Lazy Loading

```typescript
<img 
  src={imageUrl} 
  loading="lazy" 
  alt="Post image"
/>
```

### 2. Responsive Images

```typescript
<img
  src={`${imageUrl}-/resize/600x/-/quality/smart/-/format/webp/`}
  srcSet={`
    ${imageUrl}-/resize/300x/-/quality/smart/-/format/webp/ 300w,
    ${imageUrl}-/resize/600x/-/quality/smart/-/format/webp/ 600w,
    ${imageUrl}-/resize/1200x/-/quality/smart/-/format/webp/ 1200w
  `}
  sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
  alt="Post image"
/>
```

### 3. Blur Placeholder (LQIP - Low Quality Image Placeholder)

```typescript
function ImageWithPlaceholder({ imageUrl, alt }) {
  const [loaded, setLoaded] = useState(false);
  
  // Дуже маленьке зображення для placeholder
  const placeholderUrl = `${imageUrl}-/resize/20x/-/quality/lightest/-/blur/50/`;
  const fullUrl = `${imageUrl}-/resize/600x/-/quality/smart/-/format/webp/`;

  return (
    <div className="relative">
      {/* Blur placeholder */}
      <img
        src={placeholderUrl}
        alt={alt}
        className={`absolute inset-0 w-full h-full transition-opacity ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ filter: 'blur(20px)' }}
      />
      
      {/* Повне зображення */}
      <img
        src={fullUrl}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
```

---

## 📦 Завантаження файлів (без змін)

### Приклад форми створення поста

```typescript
function CreatePostForm() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      // Локальний preview
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('text', text);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('https://twitter-bny4.onrender.com/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      console.log('Post created:', data.post);
      // data.post.imageUrl тепер буде Uploadcare URL
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Що нового?"
        maxLength={280}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />
      
      {preview && (
        <img src={preview} alt="Preview" className="w-full max-w-md" />
      )}
      
      <button type="submit">Опублікувати</button>
    </form>
  );
}
```

---

## 🎯 Міграція існуючого коду

### Що потрібно змінити?

**Нічого!** Якщо твій код вже працює з `imageUrl` та `avatarUrl`, він продовжить працювати.

### Що можна покращити?

1. **Додати трансформації для оптимізації:**
   ```typescript
   // Було
   <img src={post.imageUrl} alt="Post" />
   
   // Стало (оптимізовано)
   <img 
     src={`${post.imageUrl}-/resize/600x/-/quality/smart/-/format/webp/`} 
     alt="Post" 
   />
   ```

2. **Додати responsive images:**
   ```typescript
   <img
     src={`${post.imageUrl}-/resize/600x/-/quality/smart/-/format/webp/`}
     srcSet={`
       ${post.imageUrl}-/resize/300x/-/quality/smart/-/format/webp/ 300w,
       ${post.imageUrl}-/resize/600x/-/quality/smart/-/format/webp/ 600w,
       ${post.imageUrl}-/resize/1200x/-/quality/smart/-/format/webp/ 1200w
     `}
     sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
     alt="Post"
   />
   ```

3. **Додати blur placeholder для кращого UX**

---

## 🔍 Перевірка чи використовується Uploadcare

```typescript
function isUploadcareImage(url: string | null): boolean {
  return url?.includes('ucarecdn.com') ?? false;
}

// Використання
if (isUploadcareImage(post.imageUrl)) {
  // Можна використовувати трансформації
  const optimizedUrl = `${post.imageUrl}-/resize/600x/-/quality/smart/`;
} else {
  // Локальне зображення або зовнішнє
  const url = post.imageUrl;
}
```

---

## 📊 Порівняння: До vs Після

### До (локальне сховище)
```json
{
  "imageUrl": "http://localhost:3000/uploads/post-1234567890.jpg"
}
```
- ❌ Повільна загрузка (один сервер)
- ❌ Немає CDN
- ❌ Немає автоматичної оптимізації
- ❌ Фіксований розмір

### Після (Uploadcare)
```json
{
  "imageUrl": "https://ucarecdn.com/12345678-1234-1234-1234-123456789abc/"
}
```
- ✅ Швидка загрузка (CDN по всьому світу)
- ✅ Автоматична оптимізація
- ✅ Трансформації на льоту
- ✅ Різні розміри з одного URL
- ✅ WebP підтримка
- ✅ Lazy loading

---

## 🎁 Бонус: Готові утиліти

```typescript
// utils/uploadcare.ts

export const uploadcare = {
  /**
   * Перевірка чи це Uploadcare URL
   */
  isUploadcareUrl(url: string | null): boolean {
    return url?.includes('ucarecdn.com') ?? false;
  },

  /**
   * Отримати різні розміри зображення
   */
  getSizes(url: string) {
    if (!this.isUploadcareUrl(url)) {
      return { thumbnail: url, medium: url, large: url, full: url };
    }

    return {
      thumbnail: `${url}-/resize/300x300/-/quality/smart/-/format/webp/`,
      medium: `${url}-/resize/600x600/-/quality/smart/-/format/webp/`,
      large: `${url}-/resize/1200x/-/quality/smart/-/format/webp/`,
      full: `${url}-/quality/best/`
    };
  },

  /**
   * Отримати оптимізований URL для аватара
   */
  getAvatarUrl(url: string | null, size: number = 40): string {
    if (!url || !this.isUploadcareUrl(url)) {
      return url || '';
    }

    return `${url}-/scale_crop/${size}x${size}/center/-/format/webp/-/quality/smart/`;
  },

  /**
   * Отримати blur placeholder
   */
  getPlaceholder(url: string): string {
    if (!this.isUploadcareUrl(url)) {
      return url;
    }

    return `${url}-/resize/20x/-/quality/lightest/-/blur/50/`;
  },

  /**
   * Отримати responsive srcSet
   */
  getSrcSet(url: string): string {
    if (!this.isUploadcareUrl(url)) {
      return '';
    }

    return `
      ${url}-/resize/300x/-/quality/smart/-/format/webp/ 300w,
      ${url}-/resize/600x/-/quality/smart/-/format/webp/ 600w,
      ${url}-/resize/1200x/-/quality/smart/-/format/webp/ 1200w
    `.trim();
  }
};

// Використання
import { uploadcare } from '@/utils/uploadcare';

const sizes = uploadcare.getSizes(post.imageUrl);
const avatarUrl = uploadcare.getAvatarUrl(user.avatarUrl, 100);
const srcSet = uploadcare.getSrcSet(post.imageUrl);
```

---

## ✅ Чеклист для фронтенду

- [ ] API endpoints залишились без змін
- [ ] `imageUrl` тепер починається з `https://ucarecdn.com/`
- [ ] Можна використовувати трансформації через URL
- [ ] Додати оптимізацію зображень (resize, quality, format)
- [ ] Додати responsive images (srcSet)
- [ ] Додати lazy loading
- [ ] Додати blur placeholder (опціонально)
- [ ] Створити утиліти для роботи з Uploadcare URL

---

## 🚀 Готово!

Тепер ти знаєш як працювати з Uploadcare на фронтенді. Основна перевага - **зображення автоматично оптимізуються і завантажуються швидше через CDN**, а ти можеш отримувати різні розміри одного зображення просто змінюючи URL!
