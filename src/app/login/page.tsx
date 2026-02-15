import AuthForm from './AuthForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const mode = resolvedParams?.mode as string | undefined
  const error = resolvedParams?.error as string | undefined
  const message = resolvedParams?.message as string | undefined

  return (
    <AuthForm 
      mode={mode} 
      error={error} 
      message={message} 
    />
  )
}
