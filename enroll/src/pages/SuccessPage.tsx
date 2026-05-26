import { Link, useParams } from 'react-router-dom'
import { EnrollLayout } from '../components/EnrollLayout'

export function SuccessPage() {
  const { token } = useParams<{ token: string }>()

  return (
    <EnrollLayout
      title="Thank you"
      subtitle="Your details have been saved on the Tamil Nadu MSME Platform."
    >
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-6 text-sm text-teal-900">
        <p>
          TIDCO may contact you if more information is needed. You do not need a separate login —
          use the link from WhatsApp whenever you need to update your profile.
        </p>
        {token ? (
          <Link
            to={`/enroll/${token}?tab=2`}
            className="mt-4 inline-block rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
          >
            Add more optional details
          </Link>
        ) : null}
      </div>
    </EnrollLayout>
  )
}
