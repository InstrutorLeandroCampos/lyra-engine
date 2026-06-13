import styles from './Card.module.css'

interface CardProps {
  title: string
  description?: string
  image?: string
  imageAlt?: string
  tags?: string[]
  onClick?: () => void
  className?: string
  footer?: React.ReactNode
}

function Card({
  title,
  description,
  image,
  imageAlt = '',
  tags,
  onClick,
  className,
  footer,
}: CardProps) {
  const classes = [
    styles.card,
    onClick ? styles.clickable : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {image && (
        <div className={styles.imageWrapper}>
          <img src={image} alt={imageAlt} className={styles.image} />
        </div>
      )}

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>

        {description && <p className={styles.description}>{description}</p>}

        {tags && tags.length > 0 && (
          <ul className={styles.tags} aria-label="tags">
            {tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}

export default Card
