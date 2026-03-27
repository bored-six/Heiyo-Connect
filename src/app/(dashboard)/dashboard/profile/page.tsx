import { requireUser } from "@/lib/tenant"
import { ProfileForm } from "@/components/profile/profile-form"

export default async function ProfilePage() {
  const user = await requireUser()

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your display name and avatar.
        </p>
      </div>

      <ProfileForm
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          tenantName: user.tenant.name,
        }}
      />
    </div>
  )
}
