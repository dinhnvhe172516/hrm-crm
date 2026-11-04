import styles from './PageLoader.module.css'

/**
 * PageLoader — hiển thị khi lazy-loaded page đang tải.
 * Dùng CSS Module để tránh conflict với global styles.
 */
export default function PageLoader({ fullScreen = false }) {
  return (
    <div className={`${styles.wrap} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.spinner} />
    </div>
  )
}
