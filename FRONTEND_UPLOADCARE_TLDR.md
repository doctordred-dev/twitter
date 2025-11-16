# 📸 Uploadcare для фронтенду - TL;DR

## Що змінилось?

**Майже нічого!** API залишився таким самим.

## Що нового?

### 1. URL зображень тепер виглядають так:
```
https://ucarecdn.com/12345678-1234-1234-1234-123456789abc/
```

### 2. Можна трансформувати зображення через URL:

```typescript
// Оригінал
const url = "https://ucarecdn.com/12345678-1234-1234-1234-123456789abc/";

// Thumbnail 300x300
const thumb = `${url}-/resize/300x300/`;

// WebP формат
const webp = `${url}-/format/webp/`;

// Комбінація
const optimized = `${url}-/resize/600x/-/quality/smart/-/format/webp/`;
```

## Готова утиліта

```typescript
// utils/uploadcare.ts
export const uploadcare = {
  getSizes(url: string) {
    if (!url.includes('ucarecdn.com')) return { thumbnail: url, medium: url, large: url };
    
    return {
      thumbnail: `${url}-/resize/300x300/-/quality/smart/-/format/webp/`,
      medium: `${url}-/resize/600x600/-/quality/smart/-/format/webp/`,
      large: `${url}-/resize/1200x/-/quality/smart/-/format/webp/`
    };
  },
  
  getAvatar(url: string | null, size: number = 40) {
    if (!url || !url.includes('ucarecdn.com')) return url || '';
    return `${url}-/scale_crop/${size}x${size}/center/-/format/webp/`;
  }
};

// Використання
const sizes = uploadcare.getSizes(post.imageUrl);
<img src={sizes.medium} alt="Post" />

const avatar = uploadcare.getAvatar(user.avatarUrl, 100);
<img src={avatar} alt="Avatar" />
```

## Приклад компонента

```typescript
function PostImage({ imageUrl, alt }) {
  const url = imageUrl.includes('ucarecdn.com')
    ? `${imageUrl}-/resize/600x/-/quality/smart/-/format/webp/`
    : imageUrl;
  
  return <img src={url} alt={alt} loading="lazy" />;
}
```

## Що робити?

1. ✅ Нічого не міняй в існуючому коді - все працюватиме
2. 🎨 Додай трансформації для оптимізації (опціонально)
3. 🚀 Насолоджуйся швидкою загрузкою через CDN

**Повна документація:** [FRONTEND_UPLOADCARE_GUIDE.md](./FRONTEND_UPLOADCARE_GUIDE.md)
