interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return <p className="p-6 text-sm text-gray-500">{message}</p>
}
