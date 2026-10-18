/**
 * Glass + animated blob card adapted from Uiverse.io by dylanharriscameron (stupid-mole-90).
 * Content sits on the frosted panel; blob uses Masterly indigo tokens.
 */
export default function BlobCard({ children, className = '', as: Tag = 'article', ...rest }) {
  return (
    <Tag className={`blob-card ${className}`.trim()} {...rest}>
      <div className="blob-card__blob" aria-hidden="true" />
      <div className="blob-card__panel">{children}</div>
    </Tag>
  )
}
