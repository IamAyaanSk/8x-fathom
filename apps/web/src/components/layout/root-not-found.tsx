import { Link } from '@tanstack/react-router'

function RootNotFound() {
  return (
    <div className="p-4">
      <p>This is the notFoundComponent configured on root route</p>
      <Link to="/">Start Over</Link>
    </div>
  )
}

export { RootNotFound }
